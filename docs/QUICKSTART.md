# Stan Studio - Quick Start Guide

## 🚀 Running Stan Studio with Terminal

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
```bash
# Install dependencies (if not already done)
npm install
```

### Running the Application

#### Option 1: Full Stack (Recommended)
Start both the frontend and terminal backend together:
```bash
npm run dev:full
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Start terminal backend on `http://localhost:3001`
- Open your browser automatically

#### Option 2: Separate Processes
If you prefer to run them separately:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run terminal
```

### Using the Terminal

1. **Open Terminal Panel**:
   - Click `Terminal` → `New Terminal` in the menu bar
   - Or press `Ctrl + \`` (backtick)

2. **Close Terminal Panel**:
   - Click the `X` button on the panel header
   - Or press `Ctrl + \`` again

3. **Switch Tabs**:
   - Click on `TERMINAL`, `PROBLEMS`, `OUTPUT`, etc. in the panel header

### Features

✅ **Real Terminal**: Fully functional bash/PowerShell terminal
✅ **Syntax Highlighting**: Colored output for better readability
✅ **Auto-Resize**: Terminal automatically fits the panel size
✅ **Keyboard Shortcuts**: Quick access via Ctrl+`
✅ **Multi-Tab Panel**: Switch between Terminal, Problems, Output, etc.

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Terminal Panel | `Ctrl + \`` |
| Open Command Palette | `Ctrl + Shift + P` |
| Open Folder | `Ctrl + K Ctrl + O` |
| Save File | `Ctrl + S` |
| Settings | `Ctrl + ,` |

### Troubleshooting

#### Terminal not showing
1. Make sure both frontend and backend are running
2. Check browser console for errors
3. Verify port 3001 is not in use: `ss -tulpn | grep 3001`
4. Restart with `npm run dev:full`

#### "CORS" or "Connection" errors
- The terminal backend might not be running
- Run `npm run terminal` in a separate terminal
- Check if port 3001 is accessible

#### Blank terminal screen
- Wait a few seconds for initialization
- Try clicking on the terminal area
- Refresh the page (F5)

### Development Notes

- Hot Module Replacement (HMR) is enabled
- Terminal state persists during HMR
- Backend needs manual restart if you modify `server/index.js`

### Next Steps

- Open a folder to start coding
- Use the integrated terminal for git, npm, etc.
- Explore the command palette (`Ctrl + Shift + P`)
- Check out `TERMINAL_README.md` for Tauri migration info

---

**Enjoy coding with Stan Studio! ⚡**
