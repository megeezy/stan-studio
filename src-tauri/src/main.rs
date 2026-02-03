// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::panic;
use std::process::Command;

fn main() {
  // PANIC-SAFE cleanup: Restore terminal if Rust panics
  #[cfg(not(windows))]
  panic::set_hook(Box::new(|_| {
    let _ = Command::new("stty")
        .arg("sane")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();
  }));

  // Fix 1: Disable terminal attachment immediately to prevent corruption
  #[cfg(not(windows))]
  std::thread::spawn(|| {
    let _ = Command::new("stty")
        .arg("sane")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();
  });

  app_lib::run();

  #[cfg(not(windows))]
  let _ = Command::new("stty")
        .arg("sane")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();
}
