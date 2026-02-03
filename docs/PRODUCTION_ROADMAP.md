# Stan Studio - Production Readiness Roadmap

This document outlines the critical features and quality-of-life improvements required to elevate Stan Studio from a functional Beta to a production-ready IDE competitor (comparable to VS Code).

## 1. Core Editor & File System (Priority: Critical)

### 🚨 Essential Features
- [ ] **Tab Drag-and-Drop:** Ability to reorder tabs and move them between split views.
- [ ] **Dirty State Handling:** Robust tracking of unsaved changes with "Dot" indicators and "Save?" prompts on close.
- [ ] **Binary File Support:** Proper handling/viewing of Images, PDFs, and preventing corruption when opening non-text files.
- [ ] **Safe Saving (Atomic Writes):** Write to temp file then rename to prevent data loss during crashes.
- [ ] **File Watching:** Automatically update the file tree and editor content if a file is changed externally.

### Nice-to-Have
- [ ] **Auto-Save:** Configurable auto-save on window change or delay.
- [ ] **Encoding Support:** Handling non-UTF8 files.

## 2. IntelliSense & Languages (Priority: High)

### 🚨 Essential Features
- [ ] **LSP Integration:** Integrate a Language Server Protocol client (via Tauri sidecar/Node) for real Javascript/Python/Stan autocomplete.
  - *Current Status:* Basic Monarch syntax highlighting only.
- [ ] **Go to Definition:** Ctrl+Click to jump to variable/function definition.
- [ ] **Hover Documentation:** Show types and docs on hover.
- [ ] **Diagnostics:** Red squiggles for errors (beyond simple syntax).

## 3. Terminal & Shell (Priority: High)

### 🚨 Essential Features
- [ ] **Multiple Terminals:** UI to add (+) multiple terminal instances/tabs.
- [ ] **Shell Selection:** Dropdown to choose `bash`, `zsh`, `powershell`, or `cmd`.
- [ ] **Robust PTY:** Ensure the node-pty backend handles resizing and exit codes correctly without zombie processes.
- [ ] **Copy/Paste:** Context menu and keyboard shortcuts for terminal copy/paste.

## 4. Git & Version Control (Priority: Medium)

### 🚨 Essential Features
- [ ] **Visual Diff Editor:** specialized view to compare changes `(Working Tree vs HEAD)`.
- [ ] **Authentication:** Handle SSH keys or HTTPS credentials for Push/Pull.
- [ ] **Branch Switching:** UI to create, checkout, and delete branches.
- [ ] **Commit Graph:** Visual history of commits.

## 5. UI/UX Polish (Priority: Medium)

### 🚨 Essential Features
- [ ] **System Native Menus:** Use Tauri's native menu API for top bar (File, Edit, etc) instead of HTML overlays for better OS integration.
- [ ] **ContextMenu API:** Unified context menu system for File Tree, Editor, and Tabs.
- [ ] **Accessibility:** Keyboard navigation (focus trap) and ARIA labels.
- [ ] **Settings Persistence:** Save all user preferences (Theme, Zoom, Font size) to `settings.json` on disk.

## 6. Debugging (Priority: Low for V1, High for V2)
- [ ] **Debug Adapter Protocol (DAP):** Support for breakpoints, stepping, and variable inspection.
- [ ] **Run Configurations:** `.vscode/launch.json` compatible runner.

## 7. Performance & Distribution
- [ ] **Code Signing:** Certificates for Windows (EXE) and macOS (DMG) to avoid "Unknown Publisher" warnings.
- [ ] **Auto-Updater:** Tauri Updater integration for over-the-air updates.
- [ ] **Memory Profiling:** Ensure closing tabs releases memory (Monaco instance disposal).

---

**Summary:** The current build is a functional text editor with excellent aesthetics. To become an **IDE**, the focus must shift from "Editing Text" to "Understanding Code" (LSP) and "Managing Projects" (Git/File Watching).
