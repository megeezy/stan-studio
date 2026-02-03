use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter, Runtime};
use std::thread;
use std::collections::HashMap;

pub struct TerminalInstance {
    pub writer: Box<dyn Write + Send>,
    pub master: Box<dyn MasterPty + Send>,
    pub cancelled: Arc<AtomicBool>,
}

pub struct TerminalState {
    pub terminals: Arc<Mutex<HashMap<String, TerminalInstance>>>,
}

#[tauri::command]
pub fn spawn_terminal<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, TerminalState>,
    id: String,
    shell: Option<String>,
    cwd: Option<String>,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e: anyhow::Error| e.to_string())?;

    let shell_cmd = shell.unwrap_or_else(|| {
        if cfg!(target_os = "windows") {
            "powershell.exe".to_string()
        } else {
            "bash".to_string()
        }
    });

    // Cleanup existing session if ID collision occurs
    {
        let mut terms = state.terminals.lock().unwrap();
        if terms.contains_key(&id) {
            terms.remove(&id);
        }
    }

    let mut cmd = CommandBuilder::new(&shell_cmd);
    
    // On Unix-like systems, if using bash/zsh, use --login to ensure stty/env are happy
    if !cfg!(target_os = "windows") {
        if shell_cmd.contains("bash") || shell_cmd.contains("zsh") {
            cmd.arg("--login");
        }
    }
    
    // Set working directory if provided
    if let Some(working_dir) = cwd {
        cmd.cwd(working_dir);
    }
    
    let mut child = pair.slave.spawn_command(cmd)
        .map_err(|e: anyhow::Error| e.to_string())?;

    let mut reader = pair.master.try_clone_reader()
        .map_err(|e: anyhow::Error| e.to_string())?;
    let writer = pair.master.take_writer()
        .map_err(|e: anyhow::Error| e.to_string())?;

    let cancelled = Arc::new(AtomicBool::new(false));

    {
        let mut terms = state.terminals.lock().unwrap();
        terms.insert(id.clone(), TerminalInstance {
            writer,
            master: pair.master,
            cancelled: cancelled.clone(),
        });
    }

    // Read thread
    let app_handle = app.clone();
    let terminal_id = id.clone();
    let cancelled_clone = cancelled.clone();
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        let event_name = format!("terminal-data-{}", terminal_id);
        loop {
            // Check if terminal was cancelled
            if cancelled_clone.load(Ordering::Relaxed) {
                break;
            }
            
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    // Double-check cancellation before emitting
                    if !cancelled_clone.load(Ordering::Relaxed) {
                        let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                        let _ = app_handle.emit(&event_name, data);
                    }
                }
                Err(_) => break,
            }
        }
    });

    // Wait thread
    let terminals_map = state.terminals.clone();
    let cleanup_id = id.clone();
    thread::spawn(move || {
        let _ = child.wait();
        if let Ok(mut terms) = terminals_map.lock() {
            terms.remove(&cleanup_id);
        }
    });

    Ok(())
}

#[tauri::command]
pub fn write_to_terminal(
    state: tauri::State<'_, TerminalState>,
    id: String,
    data: String,
) -> Result<(), String> {
    let mut terms = state.terminals.lock().unwrap();
    if let Some(instance) = terms.get_mut(&id) {
        instance.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        instance.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn resize_terminal(
    state: tauri::State<'_, TerminalState>,
    id: String,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    let terms = state.terminals.lock().unwrap();
    if let Some(instance) = terms.get(&id) {
        instance.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        }).map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[tauri::command]
pub fn kill_terminal(
    state: tauri::State<'_, TerminalState>,
    id: String,
) -> Result<(), String> {
    let mut terms = state.terminals.lock().unwrap();
    if let Some(instance) = terms.get(&id) {
        // Signal the read thread to stop
        instance.cancelled.store(true, Ordering::Relaxed);
    }
    // Remove the terminal (this will drop MasterPty and writer)
    terms.remove(&id);
    Ok(())
}
