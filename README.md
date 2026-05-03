# Stan Studio 🛸

[![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=flat&logo=tauri&logoColor=white)](https://tauri.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Stan Studio** is an AI-native desktop IDE designed for high-precision code generation and automated workspace manipulation. Built on **Tauri** and **React**, it integrates a powerful local AI agent named **Maya** directly into the development workflow.

[Features](#features) • [Architecture](#architecture) • [Maya AI](#maya-ai-agent) • [Quick Start](#quick-start) • [Project Structure](#project-structure)

---

## Features

*   🧠 **Maya AI Agent**: An integrated agent that doesn't just chat—it performs actions. Maya can create, edit, and delete files, and execute terminal commands.
*   💻 **Monaco Editor**: Industry-standard code editing experience with syntax highlighting and intelligent features.
*   🛠️ **Integrated Terminal**: Full-featured Xterm-based terminal with support for multi-sessions and split-screen.
*   📁 **Universal File System**: Native support for local directories via Tauri and web-based file management.
*   🚀 **Code Runner**: Execute scripts and files directly within the studio.
*   📦 **Project Portability**: Export entire project states into compressed `.stan` files for easy sharing and backup.
*   🎨 **Premium UI**: Modern, glassmorphic dark-theme design with a focus on developer ergonomics.

---

## Maya AI Agent

Maya is the brain of Stan Studio. Unlike traditional sidecar chats, Maya has direct access to your workspace tools.

### Capabilities
*   **File Manipulation**: `create_file`, `edit_file`, `delete_item`.
*   **Exploration**: `read_file`, `list_files`.
*   **Automation**: `run_command` in the integrated terminal.
*   **Local-First**: Runs via **Ollama** (defaulting to `qwen2.5-coder`) for privacy and speed.

---

## Architecture

Stan Studio uses a high-performance hybrid architecture:

*   **Frontend (React + Vite)**: Handles the premium UI, Monaco editor integration, and real-time state management.
*   **Backend (Rust + Tauri)**: Provides secure, native access to the file system, process spawning, and high-performance bridges to AI models.
*   **AI Layer (Ollama)**: Local LLM execution for agentic reasoning and code generation.

---

## Project Structure

```text
stan-studio/
├── src-tauri/                # Rust Native Bridge
│   ├── src/
│   │   ├── main.rs           # Tauri entry point
│   │   └── lib.rs            # Native tool implementations
├── src/                      # Frontend Application
│   ├── components/           # UI Components (Editor, Terminal, Panels)
│   ├── services/             # Core Logic (MayaService, FileSystem, Runner)
│   ├── utils/                # Project & State Utilities
│   └── App.jsx               # Main Application Logic
├── public/                   # Static Assets
└── package.json              # Dependencies
```

---

## Quick Start

### Prerequisites
*   **Node.js** ≥ 20.0
*   **Rust** ≥ 1.78
*   **Ollama** (Running locally for Maya's agentic features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/megeezy/stan-studio.git
   cd stan-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the studio**
   ```bash
   npm run tauri dev
   ```

### Configuration
You can switch Maya's underlying model in the **Settings** panel (default is `qwen2.5-coder:3b`).

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Built by the Stan Studio Team</p>
