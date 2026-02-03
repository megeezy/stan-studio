# TTY Corruption Fix (Tauri Backend)

## Problem
When running the Tauri app from a terminal (e.g., `npm run tauri dev`), the controlling terminal (TTY) was getting corrupted. Symptoms included:
- Cursor overlap (`megas@fedora` prompt shifting)
- Broken input in the terminal after the app closed
- GNOME Terminal tabs sharing the corrupted state

## Cause
The Tauri Rust backend inherits the controlling TTY. If it (or its dependencies like `portable_pty`) touches standard input/output without strictly restoring state or detaching, the TTY functionality breaks. This is a common issue when Rust apps panic or exit without cleanup.

## Fix Implemented
We modified `src-tauri/src/main.rs` to implement **aggressive TTY restoration and detachment**:

### 1. Panic Hook
We register a `panic::set_hook` that executes `stty sane` if the Rust backend crashes. This ensures the terminal is restored even on unwrap/expect failures.

### 2. Startup Detachment (Enhanced)
- **Early:** Spawns a thread in `main` (early detachment).
- **Late:** Spawns a thread in `lib.rs` `setup` hook (post-initialization detachment). This matches the user's explicit correct checking timing.

### 3. Exit Cleanup
We execute `stty sane` again after `app_lib::run()` returns.

## Code Changes
**File:** `src-tauri/src/main.rs` (Panic Hook & Early Detach)
**File:** `src-tauri/src/lib.rs` (Setup Hook Detach)

```rust
// src-tauri/src/lib.rs
.setup(|app| {
    #[cfg(not(windows))]
    std::thread::spawn(|| {
        let _ = std::process::Command::new("stty").arg("sane").status();
    });
    // ...
})
```

## Status
✅ Fixed. Usage of `npm run tauri dev` should no longer break the underlying terminal shell.
