use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Deserialize)]
pub struct MayaPayload {
    pub model: String,
    pub messages: Vec<MayaMessage>,
    pub stream: bool,
}

#[derive(Deserialize, Serialize)]
pub struct MayaMessage {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub async fn maya_native_request(payload: String) -> Result<String, String> {
    // We use the system's curl directly from Rust to bypass all CORS and JS sandbox limits
    let output = Command::new("curl")
        .arg("-X")
        .arg("POST")
        .arg("http://127.0.0.1:11434/api/chat")
        .arg("-H")
        .arg("Content-Type: application/json")
        .arg("-d")
        .arg(&payload)
        .output()
        .map_err(|e| format!("Failed to execute curl: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
