import React, { useEffect, useState, useCallback, Suspense, useRef, useMemo } from 'react';
import NavBar from './components/NavBar';
import ActivityBar from './components/ActivityBar';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import Panel from './components/Panel';
import Loader from './components/Loader';
import WelcomeScreen from './components/WelcomeScreen';
import { exportToStan, importFromStan } from './utils/ProjectManager';
import { FileSystem } from './services/FileSystem';
import { Runner } from './services/Runner';
import { GitService } from './services/GitService';
import welcomeBgm from './assets/stan_loader_bgm.mp3';
import AIAgent from './components/AIAgent';
import CodeCanvas from './components/CodeCanvas';

import EditorArea from './components/EditorArea';
import InputDialog from './components/InputDialog';
import { ToastContainer } from './components/Toast';
import CommandPalette from './components/CommandPalette';
import SettingsPanel from './components/SettingsPanel';
import { useSettings } from './hooks/useSettings';

const isTauri = () => typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

function App() {
  console.log("[App] Mounting...");
  const [activeFileId, setActiveFileId] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderHandle, setFolderHandle] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [currentSidebarView, setCurrentSidebarView] = useState('EXPLORER');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(null); // category name or null
  const [showPanel, setShowPanel] = useState(false);
  const [panelActiveTab, setPanelActiveTab] = useState('TERMINAL');
  const [terminalSplitTrigger, setTerminalSplitTrigger] = useState(0);
  const [terminalNewTrigger, setTerminalNewTrigger] = useState(0);
  const [recentFolders, setRecentFolders] = useState([]);
  const unwatchRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const hasWelcomedRef = useRef(false);
  const [showAIChat, setShowAIChat] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 });
  const [showCanvas, setShowCanvas] = useState(false);
  const [mayaWidth, setMayaWidth] = useState(300);
  const [isResizingMaya, setIsResizingMaya] = useState(false);

  // New UI state for Modals and Toasts
  const [toasts, setToasts] = useState([]);
  const [inputDialog, setInputDialog] = useState({
    isOpen: false,
    title: '',
    defaultValue: '',
    placeholder: '',
    onConfirm: null
  });

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const settingsContext = useSettings();
  const { settings, updateSetting, isLoaded: settingsLoaded } = settingsContext || { settings: {}, updateSetting: () => { }, isLoaded: false };

  if (!settingsContext) {
    console.error("[App] SettingsContext is missing! Check Provider in main.jsx.");
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showInput = useCallback((title, defaultValue, placeholder, description) => {
    return new Promise((resolve) => {
      setInputDialog({
        isOpen: true,
        type: 'input',
        title,
        defaultValue,
        placeholder,
        description,
        onConfirm: (val) => {
          setInputDialog(prev => ({ ...prev, isOpen: false }));
          resolve(val);
        },
        onCancel: () => {
          setInputDialog(prev => ({ ...prev, isOpen: false }));
          resolve(null);
        }
      });
    });
  }, []);

  const showConfirm = (title, description, confirmLabel = 'OK', cancelLabel = 'Cancel', thirdOptionLabel = null) => {
    return new Promise((resolve) => {
      setInputDialog({
        isOpen: true,
        type: 'confirm',
        title,
        description,
        confirmLabel,
        cancelLabel,
        thirdOptionLabel,
        onConfirm: () => {
          setInputDialog(prev => ({ ...prev, isOpen: false }));
          resolve('confirm');
        },
        onCancel: () => {
          setInputDialog(prev => ({ ...prev, isOpen: false }));
          resolve('cancel');
        },
        onThirdOption: () => {
          setInputDialog(prev => ({ ...prev, isOpen: false }));
          resolve('third');
        }
      });
    });
  };

  const handleSelectFile = useCallback(async (item) => {
    if (item.kind === 'file') {
      const isAlreadyOpen = openFiles.find(f => f.id === item.id);
      if (isAlreadyOpen) {
        if (item.revealLine) {
          setOpenFiles(prev => prev.map(f => f.id === item.id ? { ...f, revealLine: item.revealLine } : f));
        }
        setActiveFileId(item.id);
      } else {
        try {
          const isBinary = FileSystem.isBinary(item.name);
          const extension = item.name.split('.').pop().toLowerCase();
          const isPdf = extension === 'pdf';

          let content = '';
          try {
            if (isBinary) {
              content = await FileSystem.readBinaryAsDataUrl(item);
            } else {
              content = await FileSystem.readFile(item);
              // Index symbols for EVERY non-binary file opened
              import('./services/SymbolIndexer').then(module => {
                const indexer = module.SymbolIndexer;
                if (indexer) indexer.scanFile(item.id, content);
              });
            }
          } catch (err) {
            addToast(`Error reading ${item.name}: ${err.message}`, "error");
            return;
          }

          const newFile = { ...item, content, isBinary, isPdf, revealLine: item.revealLine };
          setOpenFiles(prev => [...prev, newFile]);
          setActiveFileId(item.id);
        } catch (err) {
          addToast(`Failed to read file ${item.name}: ${err.message}`, "error");
        }
      }
    }
  }, [openFiles, addToast]);

  const handleToggleTerminal = useCallback(() => {
    console.log("[App] Toggling Terminal. Current showPanel:", showPanel, "Active Tab:", panelActiveTab);
    if (!showPanel) {
      setPanelActiveTab('TERMINAL');
      setShowPanel(true);
    } else if (panelActiveTab !== 'TERMINAL') {
      setPanelActiveTab('TERMINAL');
    } else {
      setShowPanel(false);
    }
  }, [showPanel, panelActiveTab]);

  const handleSplitTerminal = useCallback(() => {
    console.log("[App] Split Terminal Triggered");
    setShowPanel(true);
    setPanelActiveTab('TERMINAL');
    setTerminalSplitTrigger(prev => prev + 1);
  }, []);

  const handleNewTerminal = useCallback(() => {
    console.log("[App] New Terminal Triggered");
    setShowPanel(true);
    setPanelActiveTab('TERMINAL');
    setTerminalNewTrigger(prev => prev + 1);
  }, []);

  const handleOpenDiff = useCallback(async (filePath) => {
    if (!folderHandle || !folderHandle.path) return;
    try {
      const cwd = folderHandle.path;
      // Resolve the full path for reading from working tree
      const relativePath = filePath;
      const fullPath = isTauri() ? `${cwd}/${relativePath}` : relativePath;

      const [originalContent, currentContent] = await Promise.all([
        GitService.getFileContentAtHead(relativePath, cwd),
        FileSystem.readFile({ id: fullPath, path: fullPath, kind: 'file' })
      ]);

      const diffId = `diff-${Date.now()}-${relativePath}`;
      const diffFile = {
        id: diffId,
        name: relativePath.split(/[/\\]/).pop(),
        path: fullPath,
        content: currentContent,
        originalContent: originalContent,
        isDiff: true,
        isDirty: false
      };

      setOpenFiles(prev => {
        // If a diff for this file is already open, focus it
        const existing = prev.find(f => f.isDiff && f.path === fullPath);
        if (existing) {
          setActiveFileId(existing.id);
          return prev;
        }
        return [...prev, diffFile];
      });
      setActiveFileId(diffId);
    } catch (err) {
      console.error("[App] Failed to open diff:", err);
      addToast(`Failed to open diff: ${err.message}`, "error");
    }
  }, [folderHandle, addToast]);


  // Computed active file data
  // Computed active file data (Memoized for performance)
  const activeFileData = useMemo(() => openFiles.find(f => f.id === activeFileId), [openFiles, activeFileId]);
  const activeFileName = useMemo(() => activeFileData ? activeFileData.name : null, [activeFileData]);

  const handleSaveFile = useCallback(async (id, content) => {
    const file = openFiles.find(f => f.id === id);
    if (file && !file.isVirtual) {
      try {
        await FileSystem.writeFile(file, content);
        console.log(`File ${file.name} saved successfully`);
        setOpenFiles(prev => prev.map(f => f.id === id ? { ...f, content, isDirty: false } : f));
      } catch (err) {
        console.error(`Failed to save file ${file.name}:`, err);
        addToast(`Failed to save ${file.name}: ${err.message}`, "error");
      }
    }
  }, [openFiles, addToast]);

  const handleSaveAll = useCallback(async () => {
    console.log("Saving all files...");
    const savePromises = openFiles
      .filter(file => !file.isVirtual)
      .map(async (file) => {
        try {
          await FileSystem.writeFile(file, file.content);
          return { id: file.id, success: true };
        } catch (err) {
          console.error(`Failed to save file ${file.name}:`, err);
          return { id: file.id, success: false };
        }
      });

    const results = await Promise.all(savePromises);
    const successfulIds = results.filter(r => r.success).map(r => r.id);
    console.log(`Successfully saved ${successfulIds.length} files.`);
  }, [openFiles]);

  useEffect(() => {
    console.log("[App] Panel Visibility Changed:", showPanel);
  }, [showPanel]);

  const refreshFileTree = useCallback(async () => {
    if (folderHandle) {
      console.log("[App] Refreshing file tree...");
      const tree = await FileSystem.scanDirectory(folderHandle);
      setFileTree(tree);
    }
  }, [folderHandle]);

  // File Watching Effect
  useEffect(() => {
    if (folderHandle && folderHandle.type === 'native' && isTauri()) {
      let isActuallyUnmounted = false;
      const startWatch = async () => {
        if (unwatchRef.current) {
          const uv = await unwatchRef.current;
          if (typeof uv === 'function') await uv();
        }

        const unwatch = await FileSystem.watchDirectory(folderHandle.path, () => {
          if (isActuallyUnmounted) return;
          // Trigger refresh on significant changes
          // Use a small timeout to debounce multiple rapid events
          clearTimeout(window._treeRefreshTimeout);
          window._treeRefreshTimeout = setTimeout(() => {
            refreshFileTree();
          }, 500);
        });
        unwatchRef.current = unwatch;
      };

      startWatch();
      return () => {
        isActuallyUnmounted = true;
        if (unwatchRef.current) {
          Promise.resolve(unwatchRef.current).then(un => {
            if (typeof un === 'function') un();
          }).catch(console.error);
        }
      };
    }
  }, [folderHandle, refreshFileTree]);

  // Auto-Save Effect
  useEffect(() => {
    const dirtyFiles = openFiles.filter(f => f.isDirty);
    if (dirtyFiles.length > 0) {
      // For now, let's say auto-save is enabled with a 5s delay
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveAll();
        addToast("Auto-saved changes", "info");
      }, 5000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [openFiles, handleSaveAll, addToast]);

  const handleSaveAs = useCallback(async (id, content) => {
    const file = openFiles.find(f => f.id === id);
    if (!file) return;

    try {
      const savedFile = await FileSystem.saveFileAs(file.name, content);
      if (!savedFile || savedFile.isVirtual) return; // Cancelled or fallback

      // Update open files: replace the virtual one with the real one
      setOpenFiles(prev => prev.map(f => f.id === id ? { ...f, ...savedFile, isVirtual: false, content } : f));
      setActiveFileId(savedFile.id);

      // Refresh tree if it's within the folder
      await refreshFileTree();
    } catch (err) {
      console.error("[App] Save As failed:", err);
      addToast("Save As failed: " + err.message, "error");
    }
  }, [openFiles, refreshFileTree, addToast]);

  const handleSaveFileLocal = useCallback(async (content) => {
    if (activeFileData) {
      // If content is not a string (e.g. it's a click event from Navbar), use the current file content
      const contentToSave = (typeof content === 'string') ? content : activeFileData.content;

      if (activeFileData.isVirtual) {
        await handleSaveAs(activeFileData.id, contentToSave);
      } else {
        await handleSaveFile(activeFileData.id, contentToSave);
      }
    }
  }, [activeFileData, handleSaveFile, handleSaveAs]);

  const handleCloseFolder = useCallback(() => {
    setFolderHandle(null);
    setFileTree([]);
    setOpenFiles([]);
    setActiveFileId(null);
    addToast("Project closed", "info");
  }, [addToast]);


  const handleRunFile = useCallback(async () => {
    if (!activeFileId || openFiles.length === 0) return;
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    // Save before running
    await handleSaveFileLocal(activeFile.content);

    // Open terminal and show starting message
    setShowPanel(true);
    setPanelActiveTab('TERMINAL');

    // Trigger a custom event that Terminal.jsx will listen to for output injection
    const injectOutput = (msg) => {
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: msg }));
    };

    injectOutput(`\x1b[34m[Runner] Starting ${activeFile.name}...\x1b[0m\r\n`);

    try {
      await Runner.runFile(activeFile, (output) => {
        injectOutput(output);
      }, (code) => {
        injectOutput(`\x1b[34m[Runner] Process finished with exit code ${code}\x1b[0m\r\n`);
      });
    } catch (err) {
      injectOutput(`\x1b[31m[Runner] Execution Failed: ${err.message}\x1b[0m\r\n`);
    }
  }, [activeFileId, openFiles, handleSaveFileLocal]);


  useEffect(() => {
    console.log("[App] Initial render complete.");
    setLoading(false);
  }, []);

  // Welcome Effect
  useEffect(() => {
    if (!loading && settingsLoaded && !hasWelcomedRef.current) {
      hasWelcomedRef.current = true;

      // Play welcome music
      const audio = new Audio(welcomeBgm);
      audio.volume = 0.4;
      audio.play().catch(e => console.warn("[App] Welcome music blocked or failed:", e));

      // Show welcome notification
      const name = settings.userName || 'Megas';
      addToast(`Great to see you again, ${name}`, 'success');
    }
  }, [loading, settingsLoaded, settings.userName, addToast]);

  const handleCommand = (commandId) => {
    switch (commandId) {
      case 'open_folder': handleOpenFolder(); break;
      case 'explorer': setCurrentSidebarView('EXPLORER'); setShowSettings(false); break;
      case 'search': setCurrentSidebarView('SEARCH'); setShowSettings(false); break;
      case 'git': setCurrentSidebarView('GIT'); setShowSettings(false); break;
      case 'settings': setShowSettings(true); break;
      case 'run': handleRunFile(); break;
      case 'terminal':
        handleToggleTerminal();
        break;
      case 'save_file':
        if (activeFileData) handleSaveFileLocal(activeFileData.content);
        break;
      case 'save_as':
        if (activeFileData) handleSaveAs(activeFileData.id, activeFileData.content);
        break;
      case 'save_all':
        handleSaveAll();
        break;
      case 'refresh':
        refreshFileTree();
        break;
      case 'close_folder':
        handleCloseFolder();
        break;
    }
  };

  const handleOpenStanProject = async () => {
    try {
      let tree, projectName;

      if (isTauri()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const path = await open({ filters: [{ name: 'Stan Project', extensions: ['stan'] }] });
        if (!path) return;
        const actualPath = Array.isArray(path) ? path[0] : path;
        const content = await readTextFile(actualPath);
        // We'd need to simulate the file object for importFromStan
        const blob = new Blob([content], { type: 'application/stan' });
        const file = new File([blob], actualPath.split(/[/\\]/).pop());
        tree = await importFromStan(file);
        projectName = file.name.replace('.stan', '');
      } else {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Stan Project', accept: { 'application/stan': ['.stan'] } }],
        });
        const file = await handle.getFile();
        tree = await importFromStan(file);
        projectName = file.name.replace('.stan', '');
      }

      let finalPath = isTauri() ? (Array.isArray(folderHandle) ? folderHandle[0] : folderHandle) : projectName;

      setFileTree(tree);
      setFolderHandle({ type: 'native', path: finalPath, name: projectName });

      // Perform initial background scan for LSP indexing
      import('./services/SymbolIndexer').then(async ({ SymbolIndexer }) => {
        // Clear any previous project's symbols
        SymbolIndexer.clearProjectSymbols();
        const scanItems = async (items) => {
          for (const item of items) {
            if (item.kind === 'file' && !FileSystem.isBinary(item.name)) {
              try {
                const content = await FileSystem.readFile(item);
                SymbolIndexer.scanFile(item.id, content);
              } catch { /* skip */ }
            } else if (item.children) {
              await scanItems(item.children);
            }
          }
        };
        scanItems(tree);
      });

      addToast(`Opened project: ${projectName}`, 'success');
      setActiveFileId(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert("Failed to open .stan project: " + err.message);
      }
    }
  };

  const handleExportProject = async () => {
    if (!folderHandle || fileTree.length === 0) {
      alert("No project open to export. Please open a folder first.");
      return;
    }

    try {
      const blob = await exportToStan(folderHandle, fileTree);

      if (isTauri()) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const path = await save({
          filters: [{ name: 'Stan Project', extensions: ['stan'] }],
          defaultPath: `${folderHandle.name}.stan`
        });
        if (path) {
          const uint8Array = new Uint8Array(await blob.arrayBuffer());
          await writeFile(path, uint8Array);
          alert(`Project successfully exported to: ${path}`);
        }
      } else {
        let handle;
        if (window.showSaveFilePicker) {
          handle = await window.showSaveFilePicker({
            suggestedName: `${folderHandle.name}.stan`,
            types: [{
              description: 'Stan Project',
              accept: { 'application/stan': ['.stan'] },
            }],
          });
        }

        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          alert(`Project successfully exported to: ${handle.name}`);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${folderHandle.name}.stan`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert("Project exported successfully to your downloads folder.");
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert("Export failed: " + err.message);
      }
    }
  };

  const handleNewFile = useCallback(async () => {
    let fileName = await showInput(
      "Create New File",
      "script.js",
      "e.g. index.html, main.py",
      "Include extension to define the language (HTML, JS, Python, etc.)"
    );
    if (!fileName) return;

    // Optional default if they still forget
    if (!fileName.includes('.')) {
      fileName += '.stan';
      addToast(`Extension missing. Using default: ${fileName}`, "info");
    }

    const newFileId = `new-file-${Date.now()}`;
    const newFile = {
      id: newFileId,
      name: fileName,
      content: '',
      isVirtual: true,
      handle: null
    };
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
  }, [showInput, addToast]);

  // Handle Open File (single file picker)
  const handleOpenFile = useCallback(async () => {
    try {
      if (isTauri()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: false,
          directory: false,
          title: 'Open File'
        });

        if (selected) {
          const { readTextFile } = await import('@tauri-apps/plugin-fs');
          const content = await readTextFile(selected);
          const fileName = selected.split(/[/\\]/).pop();
          const fileId = `file-${Date.now()}`;

          const newFile = {
            id: fileId,
            name: fileName,
            path: selected,
            content: content,
            isVirtual: false,
            type: 'native',
            handle: { path: selected }
          };

          setOpenFiles(prev => [...prev, newFile]);
          setActiveFileId(fileId);
          addToast(`Opened: ${fileName}`, 'success');
        }
      } else {
        // Browser mode
        const [fileHandle] = await window.showOpenFilePicker({
          multiple: false
        });

        const file = await fileHandle.getFile();
        const content = await file.text();
        const fileId = `file-${Date.now()}`;

        const newFile = {
          id: fileId,
          name: file.name,
          content: content,
          isVirtual: false,
          type: 'web',
          handle: fileHandle
        };

        setOpenFiles(prev => [...prev, newFile]);
        setActiveFileId(fileId);
        addToast(`Opened: ${file.name}`, 'success');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Open File] Error:', err);
        addToast(`Failed to open file: ${err.message}`, 'error');
      }
    }
  }, [addToast]);

  // Handle New Text File (quick untitled file)
  const handleNewTextFile = useCallback(() => {
    setOpenFiles(prev => {
      const fileNumber = prev.filter(f => f.name.startsWith('Untitled-')).length + 1;
      const fileName = `Untitled-${fileNumber}.txt`;
      const newFileId = `untitled-${Date.now()}`;

      const newFile = {
        id: newFileId,
        name: fileName,
        content: '',
        isVirtual: true,
        handle: null
      };

      setActiveFileId(newFileId);
      addToast(`Created: ${fileName}`, 'info');
      return [...prev, newFile];
    });
  }, [addToast]);

  const handleCreateFile = useCallback(async (clickedItem) => {
    // If we clicked a file, we want to create it in the same directory.
    // Since we don't have parent refs yet, fallback to root folderHandle if it's not a directory.
    let parentDir = clickedItem;
    if (clickedItem && clickedItem.kind !== 'directory') {
      parentDir = folderHandle;
    } else if (!clickedItem) {
      parentDir = folderHandle;
    }

    if (!parentDir) {
      addToast("Open a folder first to create files.", "error");
      return;
    }

    let fileName = await showInput(
      "New File",
      "index.html",
      "e.g. style.css, script.js",
      "Include extension to define the language (HTML, JS, Python, etc.)"
    );
    if (!fileName) return;

    if (!fileName.includes('.')) {
      fileName += '.stan';
      addToast(`Extension missing. Using default: ${fileName}`, "info");
    }

    try {
      const newItem = await FileSystem.createFile(parentDir, fileName);
      await refreshFileTree();
      handleSelectFile(newItem);
      addToast(`File created: ${fileName}`, "success");
    } catch (err) {
      console.error("[App] Create file error:", err);
      addToast("Failed to create file: " + (err.message || err.toString() || "Unknown error"), "error");
    }
  }, [folderHandle, addToast, refreshFileTree, handleSelectFile, showInput]);

  const handleCreateFolder = useCallback(async (clickedItem) => {
    let parentDir = clickedItem;
    if (clickedItem && clickedItem.kind !== 'directory') {
      parentDir = folderHandle;
    } else if (!clickedItem) {
      parentDir = folderHandle;
    }

    if (!parentDir) {
      addToast("Open a folder first to create directories.", "error");
      return;
    }

    const folderName = await showInput("New Folder", "new-folder", "Enter folder name");
    if (!folderName) return;

    try {
      await FileSystem.createDirectory(parentDir, folderName);
      await refreshFileTree();
      addToast(`Folder created: ${folderName}`, "success");
    } catch (err) {
      console.error("[App] Create folder error:", err);
      addToast("Failed to create folder: " + (err.message || err.toString() || "Unknown error"), "error");
    }
  }, [folderHandle, addToast, refreshFileTree, showInput]);

  // Handle New Window
  const handleNewWindow = useCallback(async () => {
    console.log("[New Window] Attempting to open new window...");
    addToast("Opening new window...", "info");

    if (isTauri()) {
      console.log("[New Window] Running in Tauri mode");
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const label = `stan-studio-${Date.now()}`;
        console.log(`[New Window] Creating window with label: ${label}`);

        const webview = new WebviewWindow(label, {
          url: '/',
          title: 'Stan Studio',
          width: 1280,
          height: 800,
          center: true,
          resizable: true,
          decorations: false,
          transparent: true
        });

        // Listen for window creation
        webview.once('tauri://created', () => {
          console.log('[New Window] Window created successfully');
          addToast("New window opened!", "success");
        });

        // Listen for errors
        webview.once('tauri://error', (e) => {
          console.error('[New Window] Window creation error:', e);
          addToast(`Failed to create window: ${e}`, "error");
        });

      } catch (err) {
        console.error("[New Window] Tauri failed:", err);
        console.error("[New Window] Error details:", err.message, err.stack);
        addToast(`Native window failed: ${err.message}`, "error");

        // Try browser fallback
        const newWin = window.open(window.location.href, '_blank');
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
          console.error("[New Window] Browser popup blocked");
          addToast("Popup blocked! Please allow popups in your browser settings.", "error");
        } else {
          console.log("[New Window] Browser fallback succeeded");
          addToast("New window opened (browser mode)!", "success");
        }
      }
    } else {
      console.log("[New Window] Running in browser mode");
      const newWin = window.open(window.location.href, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        console.error("[New Window] Popup blocked by browser");
        addToast("Popup blocked! Please allow popups for this site in your browser settings.", "error");
      } else {
        console.log("[New Window] Browser window opened successfully");
        addToast("New window opened!", "success");
      }
    }
  }, [addToast]);

  // Sync Recent Folders
  useEffect(() => {
    const stored = localStorage.getItem('stan-recent-folders');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentFolders(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentFolders([]);
      }
    }
  }, []);

  const updateRecentFolders = useCallback((folder) => {
    if (!folder || !folder.path) return;
    setRecentFolders(prev => {
      const filtered = prev.filter(f => f.path !== folder.path);
      const updated = [{
        name: folder.name,
        path: folder.path,
        type: folder.type || (isTauri() ? 'native' : 'web')
      }, ...filtered].slice(0, 5);
      localStorage.setItem('stan-recent-folders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleOpenFolder = useCallback(async () => {
    try {
      const folder = await FileSystem.openFolder();
      if (folder) {
        setFolderHandle(folder);
        updateRecentFolders(folder);
        const structure = await FileSystem.scanDirectory(folder);
        setFileTree(structure);
        addToast(`Working with folder: ${folder.name}`, 'success');
      }
    } catch (err) {
      addToast(`Error opening folder: ${err.message}`, 'error');
    }
  }, [updateRecentFolders, addToast]);

  const handleOpenRecent = useCallback(async (folder) => {
    try {
      // 1. Force Reset State First
      setFolderHandle(null);
      setFileTree([]);
      setOpenFiles([]);
      setActiveFileId(null);

      // Short delay to allow React to unmount previous components
      await new Promise(r => setTimeout(r, 50));

      const isNative = isTauri();

      // 2. Validate Type Match
      if (folder.type && folder.type !== (isNative ? 'native' : 'web')) {
        throw new Error(`Cannot open ${folder.type} folder in ${isNative ? 'Desktop' : 'Web'} mode.`);
      }

      // 3. Construct Correct Object
      const folderObject = {
        name: folder.name,
        path: folder.path,
        type: isNative ? 'native' : 'web',
        kind: 'directory',
        // For web, we might have lost the handle, but let's try if it was preserved (unlikely in localStorage)
        // If web and no handle, we can't reopen without user interaction usually.
        handle: folder.handle
      };

      if (!isNative && !folder.handle) {
        throw new Error("Cannot reopen web folders from history automatically. Please open manually.");
      }

      console.log("[App] Opening Recent:", folderObject);

      // 4. Scan & Load
      const structure = await FileSystem.scanDirectory(folderObject);

      setFolderHandle(folderObject);
      setFileTree(structure);
      updateRecentFolders(folder);
      addToast(`Opened recent: ${folder.name}`, 'success');

      // 5. Index Symbols
      import('./services/SymbolIndexer').then(({ SymbolIndexer }) => {
        SymbolIndexer.clearProjectSymbols();
      });

    } catch (err) {
      console.error('[Open Recent] Error:', err);
      addToast(`Failed to open recent: ${err.message}`, 'error');
    }
  }, [updateRecentFolders, addToast]);

  const handleCloneRepo = useCallback(async () => {
    if (!isTauri()) {
      alert("Git cloning is only available in the desktop version.");
      return;
    }

    const repoUrl = await showInput("Clone Repository", "", "https://github.com/username/repo.git", "Enter Git Repository URL");
    if (!repoUrl) return;

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Destination Folder'
      });

      if (!selected) return;

      addToast("Cloning repository...", "info");
      const destination = Array.isArray(selected) ? selected[0] : selected;

      // Extract repo name from URL for the subfolder
      const repoName = repoUrl.split('/').pop().replace('.git', '');
      const targetPath = `${destination}/${repoName}`;

      await GitService.clone(repoUrl, targetPath);

      addToast("Repository cloned successfully!", "success");

      // Open the cloned folder
      const folderObj = { type: 'native', path: targetPath, name: repoName, kind: 'directory' };

      setFolderHandle(folderObj);
      updateRecentFolders(folderObj);
      const structure = await FileSystem.scanDirectory(folderObj);
      setFileTree(structure);

    } catch (err) {
      console.error("Clone failed:", err);
      addToast(`Clone failed: ${err.message}`, "error");
    }
  }, [addToast, updateRecentFolders, showInput]);

  const handleNewStanProject = useCallback(async () => {
    const projectName = await showInput("New Project", "my-stan-project", "Enter project name");
    if (!projectName) return;

    const baseArchitecture = [
      {
        id: 'root-src', name: 'src', kind: 'directory', children: [
          { id: 'root-src-main', name: 'main.js', kind: 'file', content: '// Stan Entry Point\nconsole.log("Hello Stan!");', isVirtual: true }
        ]
      },
      { id: 'root-assets', name: 'assets', kind: 'directory', children: [] },
      { id: 'root-config', name: 'config.json', kind: 'file', content: JSON.stringify({ name: projectName, version: "1.0.0" }, null, 2), isVirtual: true },
      { id: 'root-readme', name: 'README.md', kind: 'file', content: `# ${projectName}\nCreated with Stan Studio.`, isVirtual: true }
    ];

    setFileTree(baseArchitecture);
    setFolderHandle({ name: projectName });
    setOpenFiles([]);
    setActiveFileId(null);
  }, [showInput]);


  const handleCloseFile = async (id) => {
    const file = openFiles.find(f => f.id === id);
    if (file && file.isDirty) {
      const result = await showConfirm(
        `Save changes to ${file.name}?`,
        "Your changes will be lost if you don't save them.",
        "Save",
        "Don't Save",
        "Cancel"
      );

      if (result === 'confirm') {
        if (file.isVirtual) {
          await handleSaveAs(file.id, file.content);
        } else {
          await handleSaveFile(file.id, file.content);
        }
      } else if (result === 'third') {
        // This is Cancel
        return;
      }
      // If 'third' (Cancel) we returned. If 'confirm' (Save) or 'cancel' (Don't Save) we proceed to close.
    }

    setOpenFiles(prev => {
      const remaining = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
  };

  // Listen for native menu events
  useEffect(() => {
    let unlisten;
    async function setup() {
      if (isTauri()) {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen('menu-event', (event) => {
          const menuId = event.payload;
          console.log("[App] Native Menu Event:", menuId);

          switch (menuId) {
            case 'new_file':
              handleCreateFile(folderHandle);
              break;
            case 'open_file':
              handleOpenFile();
              break;
            case 'open_folder':
              handleOpenFolder();
              break;
            case 'save':
              if (activeFileId) {
                const file = openFiles.find(f => f.id === activeFileId);
                if (file) handleSaveFile(file.id, file.content);
              }
              break;
            case 'save_all':
              handleSaveAll();
              break;
            case 'toggle_terminal':
              handleToggleTerminal();
              break;
            case 'zoom_in':
              updateSetting('fontSize', Math.min(30, (settings?.fontSize || 14) + 1));
              break;
            case 'zoom_out':
              updateSetting('fontSize', Math.max(8, (settings?.fontSize || 14) - 1));
              break;
            default:
              break;
          }
        });
      }
    }
    setup();
    return () => { if (unlisten) unlisten(); };
  }, [folderHandle, activeFileId, openFiles, handleToggleTerminal, handleSaveFile, handleSaveAll, updateSetting, settings, handleCreateFile, handleOpenFile, handleOpenFolder]);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewTextFile();
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'N') {
        e.preventDefault();
        handleNewWindow();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ',') {
        e.preventDefault();
        handleToggleTerminal();
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === ',') {
        e.preventDefault();
        handleNewTerminal();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'S') {
        e.preventDefault();
        handleSaveAll();
      }
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'k' && e.key === 'r')) {
        e.preventDefault();
        handleRunFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAll, handleRunFile, handleNewWindow, handleNewTextFile, handleOpenFile, handleToggleTerminal, handleNewTerminal, handleSplitTerminal, handleSaveAs]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingMaya) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < 800) {
          setMayaWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingMaya(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingMaya) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isResizingMaya]);

  if (loading || !settingsLoaded) {
    console.log("[App] Still loading...", { loading, settingsLoaded });
    return <Loader />;
  }

  return (
    <div className="stan-studio-layout">
      <MemoizedNavBar
        onNewTextFile={handleNewTextFile}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onOpenStanProject={handleOpenStanProject}
        onExportProject={handleExportProject}
        onSaveFile={handleSaveFileLocal}
        onSaveAll={handleSaveAll}
        onCloseFolder={handleCloseFolder}
        onOpenSettings={() => setShowSettings('General')}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenTerminal={handleNewTerminal}
        onToggleTerminal={handleToggleTerminal}
        onSplitTerminal={handleSplitTerminal}
        onRunFile={handleRunFile}
        onNewWindow={handleNewWindow}
        onOpenRecent={handleOpenRecent}
        onSaveAs={handleSaveAs}
        onRefresh={refreshFileTree}
        recentFolders={recentFolders}
        folderName={folderHandle ? folderHandle.name : null}
        activeFileName={activeFileName}
      />

      <div className="main-container">
        <MemoizedActivityBar
          activeView={currentSidebarView}
          onSwitchView={(view) => {
            if (view === 'COPILOT') {
              setShowAIChat(!showAIChat);
            } else if (view === 'CANVAS') {
              setShowCanvas(!showCanvas);
            } else {
              setCurrentSidebarView(view);
              setShowSettings(null);
            }
          }}
          onOpenSettings={() => setShowSettings('General')}
        />

        <MemoizedSidebar
          view={currentSidebarView}
          fileTree={fileTree}
          activeFile={activeFileData}
          openFiles={openFiles}
          onSelectItem={handleSelectFile}
          onCloseFile={handleCloseFile}
          folderHandle={folderHandle}
          onOpenFolder={handleOpenFolder}
          onCloseFolder={handleCloseFolder}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={(item) => alert('Rename: ' + item.name)}
          onDelete={(item) => alert('Delete: ' + item.name)}
          onRefresh={refreshFileTree}
          onOpenDiff={handleOpenDiff}
        />

        <div className="workbench-main" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: 'var(--bg-main)',
          position: 'relative'
        }}>
          <main className="editor-area" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            width: '100%'
          }}>
            {showSettings ? (
              <SettingsPanel initialCategory={showSettings} onClose={() => setShowSettings(null)} />
            ) : activeFileData ? (
              <EditorArea
                fileData={activeFileData}
                openFiles={openFiles}
                onSwitchTab={setActiveFileId}
                onCloseFile={handleCloseFile}
                onSave={handleSaveFileLocal}
                onContentChange={(id, content) => {
                  setOpenFiles(prev => prev.map(f => f.id === id ? { ...f, content, isDirty: true } : f));
                  // Live re-scan for canvas
                  import('./services/SymbolIndexer').then(module => {
                    const indexer = module.SymbolIndexer;
                    if (indexer) indexer.scanFile(id, content);
                  });
                }}
                onReorderTabs={setOpenFiles}
                onCursorChange={setCursorPosition}
              />
            ) : (<WelcomeScreen
              onNewFile={folderHandle ? () => handleCreateFile(folderHandle) : handleNewFile}
              onOpenFolder={handleOpenFolder}
              onNewStanProject={handleNewStanProject}
              recentFolders={recentFolders}
              onOpenRecent={handleOpenRecent}
              onCloneRepo={handleCloneRepo}
              onNewTerminal={handleNewTerminal}
            />
            )}
          </main>

          {showPanel && (
            <div style={{ borderTop: '2px solid var(--accent)', display: 'flex', flexDirection: 'column' }}>
              <Panel
                activeTab={panelActiveTab}
                onTabChange={setPanelActiveTab}
                onClose={() => setShowPanel(false)}
                splitTrigger={terminalSplitTrigger}
                newTrigger={terminalNewTrigger}
                workingDirectory={folderHandle?.path || null}
              />
            </div>
          )}
        </div>

        {showAIChat && (
          <div
            className="maya-resizer"
            onMouseDown={() => setIsResizingMaya(true)}
            style={{
              width: '4px',
              cursor: 'col-resize',
              backgroundColor: isResizingMaya ? 'var(--accent)' : 'transparent',
              transition: 'background-color 0.2s',
              zIndex: 101,
              position: 'relative',
              marginLeft: '-2px',
              marginRight: '-2px'
            }}
          />
        )}

        <AIAgent
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          activeFile={activeFileData}
          cursorPosition={cursorPosition}
          style={{ width: `${mayaWidth}px` }}
        />

        <CodeCanvas
          isOpen={showCanvas}
          onClose={() => setShowCanvas(false)}
          onNavigate={handleSelectFile}
        />
      </div>

      <MemoizedStatusBar
        fileName={activeFileName}
        projectName={folderHandle ? folderHandle.name : 'No Folder Opened'}
      />

      {showCommandPalette && (
        <CommandPalette
          isOpen={true}
          onClose={() => setShowCommandPalette(false)}
          onCommand={handleCommand}
        />
      )}

      <InputDialog {...inputDialog} onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// Memoized Components to prevent unnecessary re-renders of the whole app
const MemoizedNavBar = React.memo(NavBar);
const MemoizedActivityBar = React.memo(ActivityBar);
const MemoizedSidebar = React.memo(Sidebar);
const MemoizedStatusBar = React.memo(StatusBar);

export default App;
