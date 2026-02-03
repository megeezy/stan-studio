# Stan Studio: Development Tasks & Priority Queue

This file tracks the implementation plan to make Stan Studio the **Lightest** and **Most Advanced** IDE.
All legacy documentation has been archived in the `/docs` folder.

## 🔴 Priority 1: Critical Fixes & Stability
**Goal:** Ensure the current V1 base is bug-free and polished.

- [x] **Fix Editor Theme Sync (Dynamic Colors)**
  - Copmleted: `customColors` are now passed to Monaco, enabling live wallpaper-based theme updates.
- [x] **Terminal Features**
  - TTY Corruption fixed.
  - Resize Glitches fixed.
  - Web Links (Ctrl+Click) added.
  - Copy/Paste (Ctrl+Shift+C/V) added.
- [x] **Sidebar UX**
  - Explorer scrollbar fix (Flex layout).
  - Robust file icons added.
- [x] **Tab Drag-and-Drop**
  - Completed: Tabs in `EditorArea.jsx` can now be reordered via drag-and-drop with visual indicators.

## 🟠 Priority 2: VS Code Parity (Missing Features)
**Goal:** Match the baseline expectations of a modern IDE.

- [x] **Split Editor View**
  - Completed: Added side-by-side editing support in `EditorArea.jsx`.
- [x] **Breadcrumbs**
  - Completed: File path navigation bar added above the editor.
- [x] **Sidebar Drag & Drop**
  - Completed: File/folder moving implemented in the explorer.
- [x] **Global Search Replacement**
  - Completed: Project-wide Find/Replace is fully functional.
- [x] **Git Graph Visualization**
  - Completed: Visual commit history graph added to Source Control tab.

## � Priority 3: "The Lightest Core" (Rust Migration)
**Goal:** Replace Node.js heavy lifting with native Rust binaries.

- [x] **Rust File Watcher (`notify`)**
  - Completed: Native `notify`-based watcher implemented in Rust and wired to frontend.
- [x] **Native Search Engine (`ripgrep`)**
  - Completed: `ignore` and `regex` powered native search implemented for blazing speed.
- [x] **Binary File Handling**
  - Completed: Optimized large file handling with native Rust size checks and streaming safety.

## � Priority 4: "Antigravity" Intelligence
**Goal:** Native understanding of code.

- [x] **Rust LSP Client**
  - Completed: Native backend bridge implemented in Rust (`lsp.rs`) to spawn and manage `pyright`/`tsserver`.
- [x] **Context-Aware Agent (Maya)**
  - Completed: AI Chat "Maya" integrated with real-time cursor tracking and active file context.

## 🟢 Priority 5: Visual Features
**Goal:** Next-gen UX.

- [x] **Code Canvas**
  - Completed: Interactive node-based logic mapping with visual wires, live previews, and **Live real-time symbol sync** (re-scans on typing).
- [x] **Data & API Panels**
  - Completed: Built-in HTTP Client and Database Viewer integrated into the workspace.
- [x] **Native Permission Bypass (Rust)**
  - Completed: Implemented standard `std::fs` Rust commands to bypass Tauri's strict frontend security scopes for file creation and writing.

## 🔴 Priority 6: Essential Editor Polishing
**Goal:** Make the central coding experience feel indistinguishable from a pro tool.

- [ ] **Sidebar Outline View**
  - A real-time tree of symbols (functions/classes) in the current file for quick navigation.
- [x] **Monaco Mini-map & Sticky Scroll**
  - Completed: Mini-map is enabled by default and Sticky Scroll headers now keep context visible while reading long functions.
- [ ] **Integrated Editor Context Menu**
  - A custom, beautiful right-click menu in the editor for "Format", "Go to Definition", and "Refactor".
- [ ] **Go to Line / Fuzzy File Search**
  - A centered search bar (Ctrl+P / Ctrl+G) that looks like Spotlight/Raycast.

## 🟠 Priority 7: Workflow & Productivity
**Goal:** Speed up the developer's daily grind.

- [ ] **Snippet Manager**
  - Create and manage custom code snippets with tab-completion support.
- [ ] **Terminal Profiles & Splitting**
  - Support for Zsh, Bash, and Python REPL as profiles; improved side-by-side terminal UI.
- [ ] **Reveal in Explorer / Open in Terminal**
  - Right-click options in the sidebar to open the file's location on the OS or start a terminal there.
- [ ] **Auto-Formatting (Prettier/Black Integration)**
  - Native support for "Format on Save" using established industry standard formatters.

## � Priority 8: Advanced Visuals & Canvas
**Goal:** Make Stan Studio the most beautiful IDE in existence.

- [ ] **Canvas "Folder Grouping"**
  - Draw semi-transparent "Zones" on the canvas to visually group nodes by their directory.
- [ ] **Search in Canvas**
  - A dedicated search bar for the Code Canvas to instantly highlight specific functions.
- [ ] **Layout Customization**
  - Drag-to-resize Sidebar/Terminal panels and the ability to "Hide/Show" UI elements with animations.
- [ ] **Theme Store / Wallpaper Gallery**
  - An integrated UI to browse and apply community-made wallpapers and color palettes.

## 🔵 Priority 9: Specialized Data Tools
**Goal:** Deepen the "Data & API" panel capabilities.

- [ ] **HTTP Request History & Collections**
  - Save previous API requests and group them into folders for testing.
- [ ] **SQL Console in Database Viewer**
  - A text area to write and execute raw SQL queries against the viewed database.
- [ ] **Export Canvas as Image**
  - High-res PNG/SVG export of the logic map for documentation.

## 🟢 Priority 10: Distribution & Shipping
**Goal:** Get Stan Studio onto every developer's machine.

- [ ] **Cross-Platform Installers**
  - Native `.msi` (Windows), `.deb` (Linux), and `.dmg` (Mac) build pipelines.
- [ ] **Performance Benchmarking**
  - Optimize the Rust <-> JS bridge to handle 10,000+ file projects with zero lag.
- [ ] **Plugin Marketplace**
  - A foundation for users to download and install extensions from a central registry.

## 🟣 Priority 11: Future Intelligence (Maya v2)
**Goal:** The final frontier of AI integration.

- [ ] **Vector-Based Code Awareness**
  - Index the codebase into a local vector database for true project-wide AI context.
- [ ] **Maya Voice Commands**
  - Natural language control of the IDE (e.g., "Maya, open the canvas and find the login function").
- [ ] **Native Debugger (DAP)**
  - Implement Debug Adapter Protocol for professional GDB/LLDB/Node debugging.

---
**Progress Tracking:**
- [x] **Terminal Fixes:** TTY Corruption, Resize Glitches, Input Injection.
- [x] **Theme Engine:** Dynamic wallpaper extraction and application.
- [x] **Native FS Bypass:** Unrestricted permission model for desktop usage.
- [x] **Code Canvas:** Real-time symbol syncing and interaction.
