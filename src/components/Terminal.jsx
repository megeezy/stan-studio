import React, { useEffect, useRef, useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContextCore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import ContextMenu from './ContextMenu';
import { Copy, Clipboard } from 'lucide-react';
import 'xterm/css/xterm.css';

const isTauri = () => typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

/**
 * Terminal Component - Fully Isolated Instance
 * Each terminal has its own:
 * - Unique ID and backend process
 * - Independent XTerm instance
 * - Separate event listeners
 * - Isolated state management
 * - No shared references between instances
 */
const Terminal = ({ terminalId, shell = null, cwd = null, isVisible = true }) => {
    // Generate a truly unique ID for this specific terminal instance
    const instanceId = useRef(terminalId || `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // Refs for this terminal instance only
    const terminalRef = useRef(null);
    const xtermInstanceRef = useRef(null);
    const fitAddonInstanceRef = useRef(null);
    const backendListenerRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const isInitializedRef = useRef(false);
    const isCancelledRef = useRef(false);

    // State for this terminal instance only
    const [isReady, setIsReady] = useState(false);
    const [status, setStatus] = useState('connecting');
    const [contextMenu, setContextMenu] = useState(null);
    const { theme } = useContext(ThemeContext);

    // Check if terminal container has valid dimensions
    useEffect(() => {
        if (!terminalRef.current) return;

        const checkDimensions = () => {
            if (!terminalRef.current || isCancelledRef.current) return;
            const rect = terminalRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setIsReady(true);
            } else {
                requestAnimationFrame(checkDimensions);
            }
        };

        checkDimensions();
    }, []);

    // Main terminal initialization - completely isolated
    useEffect(() => {
        if (!isReady || !terminalRef.current || isInitializedRef.current) return;

        isInitializedRef.current = true;
        isCancelledRef.current = false;

        // Capture the terminal ID in a local variable for cleanup
        const termId = instanceId.current;
        console.log(`[Terminal ${termId}] Initializing new terminal instance`);

        const style = getComputedStyle(document.body);
        const termBg = style.getPropertyValue('--terminal-bg').trim() || style.getPropertyValue('--bg-main').trim() || '#0a0a0a';
        const termFg = style.getPropertyValue('--terminal-fg').trim() || style.getPropertyValue('--text-primary').trim() || '#ffffff';
        const accent = style.getPropertyValue('--accent').trim() || '#a855f7';

        async function initializeTerminal() {
            try {
                if (isCancelledRef.current) return;

                // Create a brand new XTerm instance for this terminal
                const xterm = new XTerm({
                    cursorBlink: true,
                    theme: {
                        background: termBg,
                        foreground: termFg,
                        cursor: accent,
                        selection: 'rgba(168, 85, 247, 0.3)',
                        black: '#000000',
                        red: '#ef4444',
                        green: '#22c55e',
                        yellow: '#eab308',
                        blue: '#3b82f6',
                        magenta: '#a855f7',
                        cyan: '#06b6d4',
                        white: '#ffffff',
                        brightBlack: '#4b5563',
                        brightRed: '#f87171',
                        brightGreen: '#4ade80',
                        brightYellow: '#facc15',
                        brightBlue: '#60a5fa',
                        brightMagenta: '#c084fc',
                        brightCyan: '#22d3ee',
                        brightWhite: '#ffffff',
                    },
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    lineHeight: 1.2,
                    allowTransparency: true,
                    convertEol: true,
                });

                // Create fit addon for this terminal
                const fitAddon = new FitAddon();
                xterm.loadAddon(fitAddon);

                // Add Web Links Addon
                xterm.loadAddon(new WebLinksAddon((event, uri) => {
                    if (isTauri()) {
                        import('@tauri-apps/plugin-shell').then(({ open }) => open(uri).catch(console.error));
                    } else {
                        window.open(uri, '_blank');
                    }
                }));
                // Custom Key Shortcuts (Ctrl+Shift+C/V)
                xterm.attachCustomKeyEventHandler((arg) => {
                    if (arg.type !== 'keydown') return true;

                    // Copy: Ctrl+Shift+C
                    if (arg.ctrlKey && arg.shiftKey && (arg.key === 'c' || arg.key === 'C')) {
                        const selection = xterm.getSelection();
                        if (selection) {
                            navigator.clipboard.writeText(selection);
                            // Clear selection after copy if desired, but VS Code keeps it. 
                            return false;
                        }
                    }

                    // Paste: Ctrl+Shift+V
                    if (arg.ctrlKey && arg.shiftKey && (arg.key === 'v' || arg.key === 'V')) {
                        navigator.clipboard.readText().then(text => {
                            if (text && isTauri()) {
                                import('@tauri-apps/api/core').then(({ invoke }) => {
                                    invoke('write_to_terminal', { id: termId, data: text });
                                });
                            } else if (text) {
                                xterm.paste(text);
                            }
                        });
                        return false;
                    }

                    return true;
                });

                xterm.open(terminalRef.current);

                xtermInstanceRef.current = xterm;
                fitAddonInstanceRef.current = fitAddon;

                // Initial fit
                setTimeout(() => {
                    if (!isCancelledRef.current && fitAddon) {
                        try {
                            fitAddon.fit();
                        } catch (e) {
                            console.debug(`[Terminal ${termId}] Initial fit error:`, e);
                        }
                    }
                }, 50);

                if (isCancelledRef.current) {
                    xterm.dispose();
                    return;
                }

                // Setup input handler for this terminal instance
                const inputDisposable = xterm.onData(async (data) => {
                    if (isCancelledRef.current) return;
                    if (isTauri()) {
                        try {
                            const { invoke } = await import('@tauri-apps/api/core');
                            await invoke('write_to_terminal', { id: termId, data });
                        } catch (err) {
                            console.error(`[Terminal ${termId}] Write error:`, err);
                        }
                    }
                });

                // Setup backend connection if in Tauri
                if (isTauri()) {
                    const { invoke } = await import('@tauri-apps/api/core');
                    const { listen } = await import('@tauri-apps/api/event');

                    if (isCancelledRef.current) {
                        inputDisposable.dispose();
                        xterm.dispose();
                        return;
                    }

                    // Spawn backend terminal process
                    console.log(`[Terminal ${termId}] Spawning backend process with shell:`, shell, 'cwd:', cwd);
                    await invoke('spawn_terminal', {
                        id: termId,
                        shell: shell || 'bash',
                        cwd: cwd || null
                    });

                    if (isCancelledRef.current) {
                        await invoke('kill_terminal', { id: termId }).catch(() => { });
                        inputDisposable.dispose();
                        xterm.dispose();
                        return;
                    }

                    setStatus('connected');

                    // Listen for output from this specific terminal
                    const eventName = `terminal-data-${termId}`;
                    console.log(`[Terminal ${termId}] Listening to event:`, eventName);

                    const unlisten = await listen(eventName, (event) => {
                        if (!isCancelledRef.current && xtermInstanceRef.current) {
                            try {
                                xtermInstanceRef.current.write(event.payload);
                            } catch (err) {
                                console.error(`[Terminal ${termId}] Write to xterm error:`, err);
                            }
                        }
                    });

                    if (isCancelledRef.current) {
                        unlisten();
                        await invoke('kill_terminal', { id: termId }).catch(() => { });
                        inputDisposable.dispose();
                        xterm.dispose();
                        return;
                    }

                    backendListenerRef.current = unlisten;

                    // Add listener for remote execution (e.g. from Maya)
                    const handleRemoteExecute = async (e) => {
                        const command = e.detail;
                        if (!isCancelledRef.current && isTauri()) {
                            try {
                                const { invoke } = await import('@tauri-apps/api/core');
                                // Write command + Enter
                                await invoke('write_to_terminal', { id: termId, data: command + '\r' });
                                console.log(`[Terminal ${termId}] Executed remote command:`, command);
                            } catch (err) {
                                console.error(`[Terminal ${termId}] Remote execute error:`, err);
                            }
                        }
                    };
                    window.addEventListener('terminal-execute-command', handleRemoteExecute);

                    // Store for cleanup
                    backendListenerRef.current = () => {
                        unlisten();
                        window.removeEventListener('terminal-execute-command', handleRemoteExecute);
                    };

                    // Sync initial terminal size
                    const { rows, cols } = xterm;
                    await invoke('resize_terminal', { id: termId, rows, cols }).catch(() => { });
                } else {
                    setStatus('connected');
                }

                // Setup resize observer for this terminal
                // Setup resize observer for this terminal
                const resizeObserver = new ResizeObserver((entries) => {
                    if (isCancelledRef.current) return;

                    // Prevent resizing if hidden or 0 dimensions
                    if (!terminalRef.current || terminalRef.current.offsetParent === null) return;
                    for (const entry of entries) {
                        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
                    }

                    if (xtermInstanceRef.current && fitAddonInstanceRef.current) {
                        try {
                            fitAddonInstanceRef.current.fit();
                            const { rows, cols } = xtermInstanceRef.current;

                            // Prevent degenerate sizes
                            if (cols < 2 || rows < 2) return;

                            if (isTauri()) {
                                import('@tauri-apps/api/core').then(({ invoke }) => {
                                    if (!isCancelledRef.current) {
                                        invoke('resize_terminal', { id: termId, rows, cols }).catch(() => { });
                                    }
                                });
                            }
                        } catch (e) {
                            console.debug(`[Terminal ${termId}] Resize error:`, e);
                        }
                    }
                });

                if (terminalRef.current) {
                    resizeObserver.observe(terminalRef.current);
                    resizeObserverRef.current = resizeObserver;
                }

            } catch (err) {
                console.error(`[Terminal ${termId}] Initialization failed:`, err);
                if (!isCancelledRef.current) {
                    setStatus('error');
                }
            }
        }

        initializeTerminal();

        // Cleanup function - completely isolated
        return () => {
            console.log(`[Terminal ${termId}] Cleaning up terminal instance`);

            isCancelledRef.current = true;

            // Disconnect resize observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            // Unlisten from backend events
            if (backendListenerRef.current) {
                backendListenerRef.current();
                backendListenerRef.current = null;
            }

            // Kill backend process
            if (isTauri()) {
                import('@tauri-apps/api/core').then(({ invoke }) => {
                    invoke('kill_terminal', { id: termId }).catch((err) => {
                        console.debug(`[Terminal ${termId}] Kill error (may already be dead):`, err);
                    });
                });
            }

            // Dispose XTerm instance
            if (xtermInstanceRef.current) {
                try {
                    xtermInstanceRef.current.dispose();
                } catch (e) {
                    console.debug(`[Terminal ${termId}] XTerm dispose error:`, e);
                }
                xtermInstanceRef.current = null;
            }

            fitAddonInstanceRef.current = null;
            isInitializedRef.current = false;
        };
    }, [isReady, shell, cwd]);

    // Handle visibility changes to fix reflow/cursor issues
    useEffect(() => {
        if (isVisible && xtermInstanceRef.current && fitAddonInstanceRef.current) {
            // Need a slight delay to allow CSS transitions to complete (display: none -> flex)
            const timer = setTimeout(() => {
                try {
                    fitAddonInstanceRef.current.fit();

                    // Force refresh of xterm viewport
                    xtermInstanceRef.current.refresh(0, xtermInstanceRef.current.rows - 1);
                    xtermInstanceRef.current.focus();

                    // Sync size with backend - Jiggle to force shell reflow
                    const { rows, cols } = xtermInstanceRef.current;
                    if (isTauri()) {
                        import('@tauri-apps/api/core').then(async ({ invoke }) => {
                            // Force reflow by temporarily changing size
                            if (cols > 2) {
                                await invoke('resize_terminal', { id: instanceId.current, rows, cols: cols - 1 }).catch(() => { });
                            }

                            // HACK: Simulate user input (Space + Backspace) to force shell prompt/cursor refresh
                            await invoke('write_to_terminal', { id: instanceId.current, data: ' \x7f' }).catch(() => { });

                            // Restore correct size after short delay
                            setTimeout(() => {
                                invoke('resize_terminal', { id: instanceId.current, rows, cols }).catch(() => { });
                            }, 150);
                        });
                    }
                } catch {
                    // console.debug('Visibility resize error');
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    // Context menu handler
    useEffect(() => {
        if (!terminalRef.current || !isReady) return;
        const currentRef = terminalRef.current;

        const handleContextMenu = (e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
        };

        currentRef.addEventListener('contextmenu', handleContextMenu);
        return () => {
            currentRef.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isReady]);

    // Copy handler
    const handleCopy = () => {
        if (xtermInstanceRef.current) {
            const selection = xtermInstanceRef.current.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection).catch((err) => {
                    console.error('Copy failed:', err);
                });
            }
        }
        setContextMenu(null);
    };

    // Paste handler
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (isTauri() && !isCancelledRef.current) {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('write_to_terminal', { id: instanceId.current, data: text });
            }
        } catch (err) {
            console.error('Paste failed:', err);
        }
        setContextMenu(null);
    };

    // Dynamic theme updates
    useEffect(() => {
        if (xtermInstanceRef.current && !isCancelledRef.current) {
            // Wait for DOM to update from ThemeContext (race condition fix)
            setTimeout(() => {
                const style = getComputedStyle(document.body);
                const termBg = style.getPropertyValue('--terminal-bg').trim() || style.getPropertyValue('--bg-main').trim() || '#0a0a0a';
                const termFg = style.getPropertyValue('--terminal-fg').trim() || style.getPropertyValue('--text-primary').trim() || '#ffffff';
                const accent = style.getPropertyValue('--accent').trim() || '#a855f7';

                try {
                    xtermInstanceRef.current.options.theme = {
                        ...xtermInstanceRef.current.options.theme,
                        background: termBg,
                        foreground: termFg,
                        cursor: accent,
                        selection: `${accent}40`,
                    };
                } catch (e) {
                    console.debug(`[Terminal ${instanceId.current}] Theme update error:`, e);
                }
            }, 50);
        }
    }, [theme]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
                ref={terminalRef}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--terminal-bg)',
                    padding: '4px'
                }}
            />

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={[
                        { label: 'Copy', icon: Copy, onClick: handleCopy, shortcut: 'Ctrl+Shift+C' },
                        { label: 'Paste', icon: Clipboard, onClick: handlePaste, shortcut: 'Ctrl+Shift+V' }
                    ]}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {status !== 'connected' && isReady && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: status === 'error' ? '#ef4444' : 'var(--text-muted)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    zIndex: 10,
                    pointerEvents: 'none',
                    textAlign: 'center'
                }}>
                    {status === 'connecting' && <span>Initializing Terminal {instanceId.current}...</span>}
                    {status === 'error' && <span>Terminal Failed to Initialize</span>}
                </div>
            )}
        </div>
    );
};

export default Terminal;
