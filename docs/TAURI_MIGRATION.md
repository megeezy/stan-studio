# Stan Studio - Tauri Migration Guide

## Overview
This document outlines all the functionality that has been prepared for Tauri migration. All features are currently using console.log placeholders with `[TAURI]`, `[EDITOR]`, `[DEBUG]`, etc. tags to indicate where Tauri APIs will be integrated.

## 📋 Table of Contents
1. [Window Management](#window-management)
2. [File System Operations](#file-system-operations)
3. [Editor Operations](#editor-operations)
4. [Terminal Operations](#terminal-operations)
5. [Debug Operations](#debug-operations)
6. [View & Navigation](#view--navigation)
7. [Help & System](#help--system)

---

## 🪟 Window Management

### Window Controls (NavBar.jsx)
**Location**: `src/components/NavBar.jsx`

#### Functions Ready for Tauri:
```javascript
// Minimize Window
handleMinimize() {
    // Replace with: appWindow.minimize();
}

// Maximize/Restore Window
handleMaximize() {
    // Replace with: appWindow.toggleMaximize();
}

// Close Window
handleClose() {
    // Replace with: appWindow.close();
}
```

#### Tauri Implementation:
```javascript
import { appWindow } from '@tauri-apps/api/window';

const handleMinimize = async () => {
    await appWindow.minimize();
};

const handleMaximize = async () => {
    await appWindow.toggleMaximize();
    const maximized = await appWindow.isMaximized();
    setIsMaximized(maximized);
};

const handleClose = async () => {
    await appWindow.close();
};
```

### Additional Window Operations:
- **New Window**: `Ctrl+Shift+N` - Create new application window
- **Close Window**: `Ctrl+Shift+W` - Close current window
- **Full Screen**: `F11` - Toggle fullscreen mode
- **Zen Mode**: `Ctrl+K Z` - Distraction-free mode

---

## 📁 File System Operations

### File Menu (NavBar.jsx)

#### Create Operations:
- **New Text File** (`Ctrl+N`): Create new untitled file
- **New File...** (`Ctrl+Alt+Windows+N`): Open file type picker dialog
- **New Window** (`Ctrl+Shift+N`): Open new window instance

#### Open Operations:
- **Open File...** (`Ctrl+O`): File picker for single file
- **Open Folder...** (`Ctrl+K Ctrl+O`): Folder picker (already implemented)
- **Open Stan Project...**: Custom .stan project file picker
- **Open Recent**: Show recent files/folders list
- **Open Workspace from File...**: Load workspace configuration

#### Save Operations:
- **Save** (`Ctrl+S`): Save current file (already implemented)
- **Save As...** (`Ctrl+Shift+S`): Save with new name/location
- **Save All** (`Ctrl+K S`): Save all modified files (already implemented)
- **Auto Save**: Toggle automatic file saving

#### Workspace Operations:
- **Add Folder to Workspace...**: Add folder to multi-root workspace
- **Save Workspace As...**: Save workspace configuration file
- **Export Project as .stan**: Package project (already implemented)

#### Tauri Implementation Example:
```javascript
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

// Open File
const handleOpenFile = async () => {
    const selected = await open({
        multiple: false,
        filters: [{
            name: 'All Files',
            extensions: ['*']
        }]
    });
    
    if (selected) {
        const contents = await readTextFile(selected);
        // Load into editor
    }
};

// Save File As
const handleSaveAs = async (content) => {
    const filePath = await save({
        filters: [{
            name: 'Text',
            extensions: ['txt', 'js', 'jsx', 'ts', 'tsx']
        }]
    });
    
    if (filePath) {
        await writeTextFile(filePath, content);
    }
};
```

---

## ✏️ Editor Operations

### Edit Menu

#### Undo/Redo:
- **Undo** (`Ctrl+Z`): Undo last change
- **Redo** (`Ctrl+Y`): Redo last undone change

#### Clipboard:
- **Cut** (`Ctrl+X`): Cut selection
- **Copy** (`Ctrl+C`): Copy selection
- **Paste** (`Ctrl+V`): Paste from clipboard

#### Find/Replace:
- **Find** (`Ctrl+F`): Find in current file
- **Replace** (`Ctrl+H`): Replace in current file
- **Find in Files** (`Ctrl+Shift+F`): Search across workspace
- **Replace in Files** (`Ctrl+Shift+H`): Replace across workspace

#### Code Formatting:
- **Toggle Line Comment** (`Ctrl+/`): Comment/uncomment line
- **Toggle Block Comment** (`Shift+Alt+A`): Block comment
- **Format Document** (`Shift+Alt+F`): Format entire document
- **Format Selection** (`Ctrl+K Ctrl+F`): Format selected code

### Selection Menu

#### Basic Selection:
- **Select All** (`Ctrl+A`): Select entire document
- **Expand Selection** (`Shift+Alt+Right`): Expand to next logical boundary
- **Shrink Selection** (`Shift+Alt+Left`): Shrink to previous boundary

#### Line Operations:
- **Copy Line Up** (`Shift+Alt+Up`): Duplicate line above
- **Copy Line Down** (`Shift+Alt+Down`): Duplicate line below
- **Move Line Up** (`Alt+Up`): Move line up
- **Move Line Down** (`Alt+Down`): Move line down

#### Multi-Cursor:
- **Add Cursor Above** (`Ctrl+Alt+Up`): Add cursor to line above
- **Add Cursor Below** (`Ctrl+Alt+Down`): Add cursor to line below
- **Add Cursors to Line Ends** (`Shift+Alt+I`): Add cursor at end of each line
- **Add Next Occurrence** (`Ctrl+D`): Select next occurrence of current word
- **Select All Occurrences** (`Ctrl+Shift+L`): Select all occurrences

---

## 🖥️ Terminal Operations

### Terminal Menu (NavBar.jsx)

#### Terminal Management:
- **New Terminal** (`Ctrl+Shift+\``): Create new terminal (already implemented)
- **Split Terminal** (`Ctrl+Shift+5`): Split current terminal (already implemented)

#### Task Running:
- **Run Task...**: Show task picker
- **Run Build Task...** (`Ctrl+Shift+B`): Run default build task
- **Show Running Tasks...**: List active tasks
- **Restart Running Task...**: Restart selected task
- **Terminate Task...**: Stop selected task

#### Configuration:
- **Configure Tasks...**: Open tasks.json
- **Configure Default Build Task...**: Set default build task

#### Tauri Implementation:
```javascript
import { Command } from '@tauri-apps/api/shell';

// Run Build Task
const runBuildTask = async () => {
    const command = new Command('npm', ['run', 'build']);
    
    command.on('close', data => {
        console.log(`Build completed with code ${data.code}`);
    });
    
    command.on('error', error => {
        console.error(`Build error: ${error}`);
    });
    
    await command.spawn();
};
```

---

## 🐛 Debug Operations

### Run Menu

#### Debugging:
- **Start Debugging** (`F5`): Start debug session
- **Run Without Debugging** (`Ctrl+F5`): Run without debugger
- **Stop Debugging** (`Shift+F5`): Stop current debug session
- **Restart Debugging** (`Ctrl+Shift+F5`): Restart debug session

#### Configuration:
- **Open Configurations**: Open launch.json
- **Add Configuration...**: Add new debug configuration

#### Debug Controls:
- **Step Over** (`F10`): Execute next line
- **Step Into** (`F11`): Step into function
- **Step Out** (`Shift+F11`): Step out of function
- **Continue** (`F5`): Continue execution

#### Breakpoints:
- **Toggle Breakpoint** (`F9`): Add/remove breakpoint
- **New Breakpoint**: Add conditional/logpoint breakpoint

---

## 🔍 View & Navigation

### View Menu

#### Panel Toggles:
- **Command Palette...** (`Ctrl+Shift+P`): Open command palette (already implemented)
- **Open View...** (`Ctrl+Q`): Quick view picker
- **Explorer** (`Ctrl+Shift+E`): Toggle file explorer
- **Search** (`Ctrl+Shift+F`): Toggle search panel
- **Source Control** (`Ctrl+Shift+G`): Toggle git panel
- **Run and Debug** (`Ctrl+Shift+D`): Toggle debug panel
- **Extensions** (`Ctrl+Shift+X`): Toggle extensions panel

#### Bottom Panel:
- **Problems** (`Ctrl+Shift+M`): Toggle problems panel
- **Output** (`Ctrl+Shift+U`): Toggle output panel
- **Debug Console** (`Ctrl+Shift+Y`): Toggle debug console
- **Terminal** (`Ctrl+\``): Toggle terminal (already implemented)

#### Editor Features:
- **Word Wrap** (`Alt+Z`): Toggle word wrap
- **Minimap**: Toggle minimap
- **Breadcrumbs**: Toggle breadcrumb navigation

### Go Menu

#### Navigation:
- **Back** (`Alt+Left`): Navigate back
- **Forward** (`Alt+Right`): Navigate forward
- **Last Edit Location** (`Ctrl+K Ctrl+Q`): Jump to last edit
- **Switch Editor** (`Ctrl+Tab`): Switch between open editors

#### Quick Navigation:
- **Go to File...** (`Ctrl+P`): Quick file picker
- **Go to Symbol in Workspace...** (`Ctrl+T`): Symbol search
- **Go to Line/Column...** (`Ctrl+G`): Jump to line number
- **Go to Bracket** (`Ctrl+Shift+\\`): Jump to matching bracket

#### Problem Navigation:
- **Next Problem** (`F8`): Jump to next error/warning
- **Previous Problem** (`Shift+F8`): Jump to previous error/warning

---

## ❓ Help & System

### Help Menu

#### Documentation:
- **Welcome**: Show welcome page
- **Documentation**: Open online docs
- **Release Notes**: Show version release notes
- **Keyboard Shortcuts Reference** (`Ctrl+K Ctrl+R`): Show shortcuts
- **Video Tutorials**: Open tutorial videos
- **Tips and Tricks**: Show productivity tips

#### Community:
- **Join Us on Discord**: Open Discord invite
- **Search Feature Requests**: Browse feature requests
- **Report Issue**: Open issue reporter

#### Legal:
- **View License**: Show software license
- **Privacy Statement**: Show privacy policy

#### Developer:
- **Toggle Developer Tools** (`Ctrl+Shift+I`): Open DevTools
- **Open Process Explorer**: Show process manager

#### Updates:
- **Check for Updates...**: Check for app updates
- **About Stan Studio**: Show about dialog with version info

#### Tauri Implementation:
```javascript
import { open as openUrl } from '@tauri-apps/api/shell';

// Open Documentation
const openDocs = async () => {
    await openUrl('https://stanstudio.dev/docs');
};

// Open Discord
const openDiscord = async () => {
    await openUrl('https://discord.gg/stanstudio');
};

// Check for Updates
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';

const checkForUpdates = async () => {
    const { shouldUpdate, manifest } = await checkUpdate();
    
    if (shouldUpdate) {
        // Show update dialog
        const install = confirm(`Update to ${manifest.version} available. Install now?`);
        if (install) {
            await installUpdate();
        }
    }
};
```

---

## 🔧 Implementation Checklist

### Phase 1: Core Window & File Operations
- [ ] Window controls (minimize, maximize, close)
- [ ] File picker dialogs (open, save)
- [ ] Folder picker
- [ ] File read/write operations
- [ ] Recent files tracking

### Phase 2: Editor Integration
- [ ] Editor commands (undo, redo, cut, copy, paste)
- [ ] Find/replace functionality
- [ ] Multi-cursor operations
- [ ] Code formatting integration

### Phase 3: Terminal & Tasks
- [ ] Terminal process spawning
- [ ] Task runner integration
- [ ] Build task execution
- [ ] Process management

### Phase 4: Debug Support
- [ ] Debug adapter integration
- [ ] Breakpoint management
- [ ] Debug session control
- [ ] Variable inspection

### Phase 5: System Integration
- [ ] External URL opening
- [ ] Auto-updater
- [ ] System notifications
- [ ] Clipboard operations
- [ ] DevTools integration

---

## 📦 Required Tauri Dependencies

Add to `Cargo.toml`:
```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open", "dialog-all", "fs-all", "window-all", "updater"] }
```

Add to `package.json`:
```json
{
  "dependencies": {
    "@tauri-apps/api": "^1.5.0"
  }
}
```

---

## 🚀 Migration Priority

1. **High Priority** (Core functionality):
   - Window controls
   - File open/save dialogs
   - File system read/write
   - Terminal integration

2. **Medium Priority** (Enhanced features):
   - Task runner
   - Debug adapter
   - Recent files
   - Auto-save

3. **Low Priority** (Nice to have):
   - Auto-updater
   - Process explorer
   - Advanced debug features
   - External integrations

---

## 📝 Notes

- All menu items are functional and ready for Tauri API integration
- Console.log statements are tagged for easy identification
- Keyboard shortcuts are already defined and documented
- UI components are fully styled and responsive
- Error handling should be added during Tauri implementation
- Consider adding loading states for async operations
- Implement proper permission handling for file system access

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
**Status**: Ready for Tauri Migration
