mod terminal;
mod filesystem;
mod search;
mod lsp;
mod maya;

use terminal::{TerminalState, spawn_terminal, write_to_terminal, resize_terminal, kill_terminal};
use filesystem::{FileWatcherState, scan_directory_native, watch_directory_native, unwatch_directory_native, read_file_safe_native, create_file_native, mkdir_native, write_file_native};
use search::{search_in_files_native, list_files_native};
use lsp::{LSPState, start_lsp, stop_lsp, send_lsp_message};
use maya::maya_native_request;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_notification::init())
    .manage(TerminalState {
      terminals: Arc::new(Mutex::new(HashMap::new())),
    })
    .manage(FileWatcherState {
      watchers: Arc::new(Mutex::new(HashMap::new())),
    })
    .manage(LSPState {
      processes: Arc::new(Mutex::new(HashMap::new())),
    })
    .invoke_handler(tauri::generate_handler![
      spawn_terminal,
      write_to_terminal,
      resize_terminal,
      kill_terminal,
      scan_directory_native,
      watch_directory_native,
      unwatch_directory_native,
      read_file_safe_native,
      create_file_native,
      mkdir_native,
      write_file_native,
      search_in_files_native,
      list_files_native,
      start_lsp,
      stop_lsp,
      send_lsp_message,
      maya_native_request
    ])
    .setup(|app| {
      // Fix TTY corruption: Detach from terminal
      #[cfg(not(windows))]
      std::thread::spawn(|| {
          let _ = std::process::Command::new("stty")
              .arg("sane")
              .stdout(std::process::Stdio::null())
              .stderr(std::process::Stdio::null())
              .status();
      });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .on_menu_event(|app, event| {
      use tauri::Emitter;
      let _ = app.emit("menu-event", event.id().as_ref());
    })


    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
