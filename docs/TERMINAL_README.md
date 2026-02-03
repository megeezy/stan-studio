# Terminal Implementation Guide

## Current Implementation (Web-Based)

### Architecture
- **Frontend**: React + XTerm.js
- **Backend**: Node.js + node-pty + Socket.io
- **Communication**: WebSocket (with polling fallback)

### How to Run
```bash
# Start both frontend and terminal backend
npm run dev:full

# Or run separately:
npm run dev        # Frontend only (port 5173)
npm run terminal   # Terminal backend only (port 3001)
```

### Current Issues & Solutions

#### Issue: "can't access property 'dimensions'" Error
**Cause**: XTerm.js tries to render before the DOM container has proper dimensions.

**Solution Applied**: 
- Added dimension checking before initialization
- Used `requestAnimationFrame` to wait for proper layout
- Added `isReady` state to control initialization timing

#### Issue: Terminal not showing
**Cause**: Timing issues between React rendering and XTerm initialization.

**Solution Applied**:
- Two-phase initialization (dimension check → terminal creation)
- Proper cleanup in useEffect
- ResizeObserver for dynamic resizing

### Files Modified
1. `/src/components/Terminal.jsx` - XTerm.js integration
2. `/src/components/Panel.jsx` - Panel container
3. `/src/App.jsx` - State management for panel visibility
4. `/src/components/NavBar.jsx` - "New Terminal" menu item
5. `/server/index.js` - PTY backend server
6. `/package.json` - Scripts for concurrent execution

---

## Future: Tauri Migration

### Why Tauri Will Fix These Issues

When you migrate to Tauri, the terminal implementation will be **much simpler and more reliable**:

#### 1. **No Socket.io Needed**
Instead of:
```javascript
// Current: Socket.io connection
const socket = io('http://localhost:3001');
socket.emit('input', data);
```

You'll use:
```javascript
// Tauri: Direct Rust command
import { invoke } from '@tauri-apps/api/tauri';
await invoke('terminal_input', { data });
```

#### 2. **Native Shell Process**
Tauri provides native APIs to spawn shell processes directly from Rust, eliminating:
- CORS issues
- Connection timing problems
- Port conflicts
- The need for a separate Node.js backend

#### 3. **Better Performance**
- Direct IPC instead of WebSocket overhead
- Native process management
- Lower memory footprint

### Tauri Terminal Implementation (Preview)

#### Rust Backend (`src-tauri/src/main.rs`)
```rust
use tauri::command;
use std::process::{Command, Stdio};

#[command]
fn spawn_terminal() -> Result<String, String> {
    let shell = if cfg!(target_os = "windows") {
        "powershell.exe"
    } else {
        "bash"
    };
    
    // Spawn shell process
    let child = Command::new(shell)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    
    Ok("Terminal spawned".to_string())
}
```

#### Frontend (React)
```javascript
import { invoke } from '@tauri-apps/api/tauri';

// Much simpler - no socket.io, no timing issues
const Terminal = () => {
    useEffect(() => {
        invoke('spawn_terminal');
    }, []);
    
    // XTerm.js still works the same way
    // But data flows through Tauri IPC instead of WebSocket
};
```

### Migration Checklist

When you're ready to migrate to Tauri:

- [ ] Install Tauri CLI: `npm install -D @tauri-apps/cli`
- [ ] Initialize Tauri: `npx tauri init`
- [ ] Move terminal logic from `server/index.js` to Rust commands
- [ ] Replace socket.io calls with `@tauri-apps/api` calls
- [ ] Remove `server/` directory
- [ ] Update `package.json` scripts
- [ ] Test on Linux, Windows, macOS

### Benefits of Tauri for Stan Studio

1. **True Desktop App**: Native window management, system tray, etc.
2. **Smaller Bundle Size**: ~3-5MB vs Electron's ~100MB+
3. **Better Security**: Rust backend is memory-safe
4. **Native File System**: No need for File System Access API
5. **Better Terminal**: Native PTY without WebSocket overhead
6. **Cross-Platform**: Single codebase for Linux, Windows, macOS

---

## Troubleshooting

### Terminal not connecting
```bash
# Check if backend is running
ss -tulpn | grep 3001

# Restart backend
npm run terminal
```

### XTerm errors in console
These are expected during hot-reload in development. They'll disappear in production and won't exist in Tauri.

### Terminal shows but is blank
1. Check browser console for connection errors
2. Verify backend is running on port 3001
3. Try refreshing the page
4. Check `server/index.js` logs

---

## Technical Notes

### Why Two useEffect Hooks?
```javascript
// First: Wait for DOM to have dimensions
useEffect(() => {
    checkDimensions();
}, []);

// Second: Initialize terminal once ready
useEffect(() => {
    if (!isReady) return;
    // ... initialize XTerm
}, [isReady]);
```

This prevents the "dimensions undefined" error by ensuring the container is fully rendered before XTerm tries to measure it.

### ResizeObserver vs Window Resize
We use `ResizeObserver` instead of `window.addEventListener('resize')` because:
- It detects container size changes (e.g., panel resizing)
- More accurate for flex/grid layouts
- Fires when the terminal container changes, not just the window

---

## Next Steps

1. ✅ Terminal backend implemented
2. ✅ XTerm.js integration working
3. ✅ Panel management (show/hide)
4. ⏳ Multiple terminal instances
5. ⏳ Terminal tabs
6. ⏳ Tauri migration

**Recommendation**: Keep the current implementation for web development, but plan for Tauri migration when you're ready to distribute Stan Studio as a desktop application.
