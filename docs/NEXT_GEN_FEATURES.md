# Stan Studio: Evolution Roadmap (Lightest & Advanced)

## Core Philosophy: "Zero Gravity"
To build the world's **lightest** IDE that scales to become the **most advanced** only when needed.
*Base Memory Footprint Goal: < 100MB*

---

## 1. 🪶 The "Lightest" Core (Performance First)
*We reject the "Electron Bloat". Every feature must justify its weight.*

### A. Modular "Feature Flag" Architecture
- **Concept:** Unlike VS Code which loads everything, Stan Studio starts as a raw text editor.
- **Action:** Validates code, git, and AI features are loaded **lazily** only when a file type requiring them is opened.
- **Result:** You can use it as a `Notepad` replacement (instant open) or a full IDE.

### B. Native Rust Backend (Removing Node.js)
- **Concept:** Replace heavy Node.js sidecars with compiled Rust binaries.
- **Components:**
  - **Watcher:** `notify` crate (0% CPU idle).
  - **Search:** `ripgrep` (Embedded, no spawn overhead).
  - **LSP Proxy:** Lightweight `stdio` streaming without V8 overhead.

### C. GPU-First Rendering
- **Editor:** Virtualized DOM that renders only what you see.
- **Terminal:** WebGL-accelerated (Already Live).
- **Minimap:** Canvas-based off-thread rendering.

---

## 2. 🧠 The "Most Advanced" Layer (On-Demand)
*Advanced features that feel weightless.*

### A. Local AI Orchestrator ("Maya Core")
- **Concept:** A local RAG system that indexes your code in the background (low priority thread).
- **Privacy:** 100% Local. No cloud latency. No data leaks.

### B. Native Tooling (No Context Switching)
- **Built-in HTTP Client:** Test APIs without opening Postman.
- **Built-in DB Viewer:** View SQLite/SQL files instantly.
- **Benefit:** Saves RAM by not needing 5 external Electron apps running.

---

## 3. Implementation Priorities (Phase 1)

### Phase 1: The Native Foundation
1. **Rust File Watcher:** Instant file tree updates.
2. **LSP Client (Rust):** Connect `pyright`/`tsserver` efficiently.
3. **Global Search:** `Cmd+P` powered by Rust.

---

**Summary:** Stan Studio stays light by doing heavy lifting in Rust and keeping the UI layer thin.
