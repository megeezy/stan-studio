use tauri::{AppHandle, Emitter, State, Wry};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::path::Path;
use notify::{Config, RecursiveMode, Watcher};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileItem>>,
}

#[derive(Serialize, Clone, Debug)]
pub struct NativeWatchEvent {
    pub paths: Vec<String>,
    pub kind: String,
}

pub struct FileWatcherState {
    pub watchers: Arc<Mutex<HashMap<String, notify::RecommendedWatcher>>>,
}

#[tauri::command]
pub fn scan_directory_native(path: String) -> Result<Vec<FileItem>, String> {
    let root_path = Path::new(&path);
    if !root_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    fn walk(current_path: &Path) -> Vec<FileItem> {
        let mut items = Vec::new();

        if let Ok(entries) = std::fs::read_dir(current_path) {
            for entry in entries.flatten() {
                let path_buf = entry.path();
                let file_name = path_buf.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                // Simple exclusion list for speed
                if file_name.starts_with('.') && file_name != ".stan" {
                    continue;
                }
                if file_name == "node_modules" || file_name == "target" || file_name == "dist" {
                    // We might still want to show them but not recurse deeply?
                    // For "Lightest Core", let's hide node_modules from recursive scan for now
                    // In a real IDE, you'd scan a few levels or lazily.
                }

                let is_dir = path_buf.is_dir();
                let full_path = path_buf.to_string_lossy().to_string();

                let mut item = FileItem {
                    id: full_path.clone(),
                    name: file_name,
                    kind: if is_dir { "directory".to_string() } else { "file".to_string() },
                    path: full_path,
                    children: None,
                };

                if is_dir {
                    // Limit depth for safety or provide a better way to handle deep trees
                    // For now, simple recursion
                    item.children = Some(walk(&path_buf));
                }

                items.push(item);
            }
        }

        // Sort: directories first, then alphabetical
        items.sort_by(|a, b| {
            if a.kind == b.kind {
                a.name.to_lowercase().cmp(&b.name.to_lowercase())
            } else if a.kind == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        });

        items
    }

    Ok(walk(root_path))
}

#[tauri::command]
pub fn watch_directory_native(
    app: AppHandle<Wry>,
    state: State<'_, FileWatcherState>,
    path: String,
) -> Result<(), String> {
    let mut watchers = state.watchers.lock().unwrap();
    
    // Cleanup existing watcher for this path if any
    if watchers.contains_key(&path) {
        watchers.remove(&path);
    }

    let app_handle = app.clone();
    let watch_path = path.clone();

    let (tx, rx) = std::sync::mpsc::channel();
    
    let mut watcher = notify::RecommendedWatcher::new(tx, Config::default())
        .map_err(|e| e.to_string())?;

    watcher.watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    watchers.insert(path, watcher);

    // Spawn a thread to handle events
    std::thread::spawn(move || {
        for res in rx {
            match res {
                Ok(event) => {
                    // Map notify::Event to serializable NativeWatchEvent
                    let native_event = NativeWatchEvent {
                        paths: event.paths.iter().map(|p| p.to_string_lossy().to_string()).collect(),
                        kind: format!("{:?}", event.kind),
                    };
                    // Emit change event to frontend
                    let _ = app_handle.emit("native-file-change", native_event);
                },
                Err(e) => println!("watch error: {:?}", e),
            }
        }
        println!("Watcher thread for {} exiting", watch_path);
    });

    Ok(())
}

#[tauri::command]
pub fn unwatch_directory_native(
    state: State<'_, FileWatcherState>,
    path: String,
) -> Result<(), String> {
    let mut watchers = state.watchers.lock().unwrap();
    watchers.remove(&path);
    Ok(())
}

#[tauri::command]
pub fn read_file_safe_native(path: String, max_size: Option<usize>) -> Result<String, String> {
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err("File not found".to_string());
    }

    let metadata = std::fs::metadata(file_path).map_err(|e| e.to_string())?;
    let size = metadata.len() as usize;
    let limit = max_size.unwrap_or(1024 * 1024 * 5); // 5MB default limit for safety

    if size > limit {
        return Err(format!("File is too large ({} bytes). Limit is {} bytes.", size, limit));
    }

    let content = std::fs::read(file_path).map_err(|e| e.to_string())?;
    
    // Check if binary (very simple check for null bytes or invalid utf8)
    match String::from_utf8(content) {
        Ok(text) => Ok(text),
        Err(_) => Err("BINARY_FILE_DETECTED".to_string()),
    }
}
#[tauri::command]
pub fn create_file_native(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    std::fs::write(file_path, "").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn mkdir_native(path: String) -> Result<(), String> {
    let dir_path = Path::new(&path);
    std::fs::create_dir_all(dir_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn write_file_native(path: String, content: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    std::fs::write(file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

