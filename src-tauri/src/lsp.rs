use tauri::{command, AppHandle, Runtime, Window, Emitter, Manager};
use std::process::{Command, Stdio, Child};
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::thread;

pub struct LSPState {
    pub processes: Arc<Mutex<HashMap<String, Child>>>,
}

#[command]
pub async fn start_lsp<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    lang_id: String,
    command_str: String,
    args: Vec<String>,
) -> Result<String, String> {
    let state = app.state::<LSPState>();
    let mut processes = state.processes.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    
    // Kill existing if any
    if let Some(mut existing) = processes.remove(&lang_id) {
        let _ = existing.kill();
    }

    let mut child = Command::new(&command_str)
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn {}: {}", command_str, e))?;

    let _stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let lang_id_clone = lang_id.clone();
    let window_clone = window.clone();

    // Read Stdout
    thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    let _ = window_clone.emit(&format!("lsp-stdout-{}", lang_id_clone), line.trim().to_string());
                }
                Err(_) => break,
            }
        }
    });

    // Read Stderr
    let lang_id_clone = lang_id.clone();
    let window_clone = window.clone();
    thread::spawn(move || {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    let _ = window_clone.emit(&format!("lsp-stderr-{}", lang_id_clone), line.trim().to_string());
                }
                Err(_) => break,
            }
        }
    });

    processes.insert(lang_id.clone(), child);

    Ok(format!("LSP started for {}", lang_id))
}

#[command]
pub async fn send_lsp_message<R: Runtime>(
    app: AppHandle<R>,
    lang_id: String,
    message: String,
) -> Result<(), String> {
    let state = app.state::<LSPState>();
    let mut processes = state.processes.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    if let Some(child) = processes.get_mut(&lang_id) {
        if let Some(stdin) = child.stdin.as_mut() {
            stdin.write_all(message.as_bytes()).map_err(|e: std::io::Error| e.to_string())?;
            stdin.write_all(b"\n").map_err(|e: std::io::Error| e.to_string())?;
            stdin.flush().map_err(|e: std::io::Error| e.to_string())?;
            return Ok(());
        }
    }
    Err("LSP process not found or stdin not available".to_string())
}

#[command]
pub async fn stop_lsp<R: Runtime>(
    app: AppHandle<R>,
    lang_id: String,
) -> Result<(), String> {
    let state = app.state::<LSPState>();
    let mut processes = state.processes.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    if let Some(mut child) = processes.remove(&lang_id) {
        let _ = child.kill();
    }
    Ok(())
}
