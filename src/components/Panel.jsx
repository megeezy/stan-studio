import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Columns2, Plus, Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import Terminal from './Terminal';
import { useDiagnostics } from '../context/DiagnosticsContext';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ProblemsView = () => {
    const { getAllDiagnostics } = useDiagnostics();
    const diagnostics = getAllDiagnostics();

    if (diagnostics.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No problems detected.
            </div>
        );
    }

    return (
        <div className="problems-list" style={{ height: '100%', overflowY: 'auto', padding: '10px 0' }}>
            {diagnostics.map((d, i) => (
                <div key={i} className="problem-item" style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '4px 20px',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.02)'
                }}>
                    <div style={{ paddingTop: '2px' }}>
                        {d.severity === 8 ? <AlertCircle size={14} color="#ef4444" /> :
                            d.severity === 4 ? <AlertTriangle size={14} color="#eab308" /> :
                                <Info size={14} color="#3b82f6" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)' }}>{d.message}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            {d.file ? d.file.split('/').pop() : 'Unknown'} [{d.startLineNumber}, {d.startColumn}]
                        </div>
                    </div>
                </div>
            ))}
            <style>{`
                .problem-item:hover { background-color: var(--bg-selection); }
            `}</style>
        </div>
    );
};

const isTauri = () => typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

const SHELLS = [
    { label: 'bash', value: 'bash' },
    { label: 'zsh', value: 'zsh' },
    { label: 'powershell', value: 'powershell.exe' },
    { label: 'cmd', value: 'cmd.exe' },
    { label: 'sh', value: 'sh' }
];

const Panel = ({ activeTab, onTabChange, onClose, splitTrigger, newTrigger, workingDirectory = null }) => {
    // 1. State declarations
    const [height, setHeight] = useState(280);
    const [isResizing, setIsResizing] = useState(false);
    const [showShellMenu, setShowShellMenu] = useState(false);
    const [isPaneResizing, setIsPaneResizing] = useState(false);

    // 2. Refs
    const resizingPaneIdx = useRef(-1);
    const panelRef = useRef(null);
    const terminalContainerRef = useRef(null);
    const shellMenuRef = useRef(null);
    const hasInitialized = useRef(false);

    // 3. Helper Handlers
    const addTerminal = useCallback((shellConfig = null) => {
        const shell = shellConfig ? shellConfig.value : 'bash';
        const label = shellConfig ? shellConfig.label : 'bash';

        // Generate truly unique IDs with high entropy
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 11);
        const counter = Math.floor(Math.random() * 10000);

        const newTerminalId = `term-${timestamp}-${randomStr}-${counter}`;
        const newPaneId = `pane-${timestamp}-${randomStr}-${counter}`;

        const newTerminal = {
            id: newTerminalId,
            name: `${label}`,
            shell: shell,
            panes: [{ id: newPaneId, width: 100 }]
        };

        console.log('[Panel] Creating new terminal:', newTerminalId);
        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(newTerminalId);
        setShowShellMenu(false);
    }, []);

    // 4. Terminal State - Start empty, will be populated by effect
    const [terminals, setTerminals] = useState([]);
    const [activeTerminalId, setActiveTerminalId] = useState(null);
    const previousNewTrigger = useRef(0);

    // 5. Lifecycle Effects - Initialize first terminal or respond to triggers
    useEffect(() => {

        if (!hasInitialized.current) {
            hasInitialized.current = true;
            // Create initial terminal only if panel is opened without a specific trigger
            addTerminal();
            previousNewTrigger.current = newTrigger;
            return;
        }

        // Only respond to NEW trigger changes (when the value actually increases)
        if (newTrigger > previousNewTrigger.current) {
            addTerminal();
            previousNewTrigger.current = newTrigger;
        }
    }, [newTrigger, addTerminal]);

    const handleRenameTerminal = (id) => {
        const term = terminals.find(t => t.id === id);
        if (!term) return;
        const newName = prompt("Rename Terminal:", term.name);
        if (newName) {
            setTerminals(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
        }
    };

    const splitTerminal = useCallback(() => {
        setTerminals(prev => prev.map(t => {
            if (t.id === activeTerminalId) {
                if (t.panes.length >= 3) return t;

                // Generate unique pane ID
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 11);
                const counter = Math.floor(Math.random() * 10000);
                const newPaneId = `pane-${timestamp}-${randomStr}-${counter}`;

                const equalWidth = 100 / (t.panes.length + 1);
                const updatedPanes = t.panes.map(p => ({ ...p, width: equalWidth }));

                console.log('[Panel] Splitting terminal, new pane:', newPaneId);
                return { ...t, panes: [...updatedPanes, { id: newPaneId, width: equalWidth }] };
            }
            return t;
        }));
    }, [activeTerminalId]);

    useEffect(() => {
        if (splitTrigger > 0) {
            const timer = setTimeout(() => {
                splitTerminal();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [splitTrigger, splitTerminal]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newHeight = window.innerHeight - e.clientY;
                if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
                    setHeight(newHeight);
                }
            } else if (isPaneResizing && terminalContainerRef.current) {
                const containerRect = terminalContainerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - containerRect.left;
                const totalWidth = containerRect.width;
                const percentage = (mouseX / totalWidth) * 100;

                setTerminals(prev => prev.map(t => {
                    if (t.id === activeTerminalId) {
                        const newPanes = [...t.panes];
                        const idx = resizingPaneIdx.current;
                        const currentPaneTotal = newPanes[idx].width + newPanes[idx + 1].width;
                        const prevPanesWidth = newPanes.slice(0, idx).reduce((acc, p) => acc + p.width, 0);

                        let newLeftWidth = percentage - prevPanesWidth;
                        let newRightWidth = currentPaneTotal - newLeftWidth;

                        if (newLeftWidth > 10 && newRightWidth > 10) {
                            newPanes[idx].width = newLeftWidth;
                            newPanes[idx + 1].width = newRightWidth;
                        }
                        return { ...t, panes: newPanes };
                    }
                    return t;
                }));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setIsPaneResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing || isPaneResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isResizing ? 'ns-resize' : 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, isPaneResizing, activeTerminalId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShellMenu && shellMenuRef.current && !shellMenuRef.current.contains(event.target)) {
                setShowShellMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShellMenu]);

    const removeTerminal = async (e, id) => {
        if (e) e.stopPropagation();
        if (terminals.length === 1) return;

        console.log('[Panel] Removing terminal:', id);
        const term = terminals.find(t => t.id === id);
        if (term && isTauri()) {
            const { invoke } = await import('@tauri-apps/api/core');
            // Kill all panes in this terminal
            const killPromises = term.panes.map(pane =>
                invoke('kill_terminal', { id: `${id}-${pane.id}` })
                    .then(() => console.log('[Panel] Killed pane:', `${id}-${pane.id}`))
                    .catch((err) => console.error('[Panel] Error killing pane:', `${id}-${pane.id}`, err))
            );
            // Wait for all kills to complete
            await Promise.all(killPromises);
        }

        const newTerminals = terminals.filter(t => t.id !== id);
        setTerminals(newTerminals);
        if (activeTerminalId === id && newTerminals.length > 0) {
            setActiveTerminalId(newTerminals[0].id);
        }
    };

    const removePane = async (terminalId, paneIndex) => {
        const term = terminals.find(t => t.id === terminalId);
        if (term && term.panes[paneIndex] && isTauri()) {
            const { invoke } = await import('@tauri-apps/api/core');
            invoke('kill_terminal', { id: `${terminalId}-${term.panes[paneIndex].id}` }).catch(() => { });
        }

        setTerminals(prev => prev.map(t => {
            if (t.id === terminalId) {
                if (t.panes.length === 1) return t;
                const removedWidth = t.panes[paneIndex].width;
                const newPanes = t.panes.filter((_, idx) => idx !== paneIndex);
                if (newPanes.length > 0) {
                    newPanes[0].width += removedWidth;
                }
                return { ...t, panes: newPanes };
            }
            return t;
        }));
    };



    return (
        <div ref={panelRef} className="bottom-panel" style={{
            height: `${height}px`,
            minHeight: '100px',
            maxHeight: 'calc(100vh - 200px)',
            backgroundColor: 'var(--bg-header)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 100,
            flexShrink: 0
        }}>
            <div onMouseDown={() => setIsResizing(true)} style={{ height: '6px', width: '100%', cursor: 'ns-resize', position: 'absolute', top: '-3px', left: 0, zIndex: 10 }} />

            <div className="panel-header" style={{
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '20px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0
            }}>
                {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'].map(tab => (
                    <span
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab}
                    </span>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <X size={14} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>
            </div>

            <div className="panel-content" style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: activeTab === 'TERMINAL' ? 'var(--terminal-bg)' : 'transparent',
                minHeight: 0
            }}>
                {activeTab === 'TERMINAL' && (
                    <div className="terminal-switcher" style={{
                        width: '180px',
                        borderRight: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-sidebar)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px 0',
                        overflow: 'visible',
                        flexShrink: 0,
                        position: 'relative'
                    }}>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Terminals</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Columns2 size={13} style={{ cursor: 'pointer', opacity: 0.7 }} title="Split Terminal" onClick={splitTerminal} />
                                <div style={{ position: 'relative' }} ref={shellMenuRef}>
                                    <Plus size={15} style={{ cursor: 'pointer', opacity: 0.7 }} title="New Terminal" onClick={(e) => { e.stopPropagation(); setShowShellMenu(!showShellMenu); }} />
                                    {showShellMenu && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '24px',
                                            right: 0,
                                            backgroundColor: 'var(--bg-popup)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            padding: '4px 0',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                            zIndex: 999,
                                            minWidth: '160px',
                                            animation: 'panelMenuIn 0.15s ease-out'
                                        }}>
                                            <div style={{ padding: '6px 12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Shell</div>
                                            <div className="separator" style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                                            {SHELLS.map(s => (
                                                <div key={s.value} onClick={() => addTerminal(s)} style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    transition: 'all 0.1s'
                                                }} className="shell-menu-item">
                                                    <TerminalIcon size={13} style={{ opacity: 0.6 }} />
                                                    {s.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {terminals.map(term => (
                            <div
                                key={term.id}
                                onClick={() => setActiveTerminalId(term.id)}
                                className={`terminal-entry ${activeTerminalId === term.id ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 12px',
                                    fontSize: '11px',
                                    color: activeTerminalId === term.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    gap: '8px',
                                    position: 'relative'
                                }}
                            >
                                <TerminalIcon size={12} />
                                <span onDoubleClick={() => handleRenameTerminal(term.id)} style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {term.name}
                                </span>
                                <div onClick={(e) => removeTerminal(e, term.id)} className="remove-term-icon" style={{
                                    opacity: activeTerminalId === term.id ? 1 : 0,
                                    display: terminals.length > 1 ? 'flex' : 'none',
                                    transition: 'color 0.2s'
                                }}>
                                    <Trash2 size={10} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div ref={terminalContainerRef} className="terminal-container" style={{ flex: 1, position: 'relative', height: '100%', display: 'flex' }}>
                        <div style={{ display: activeTab === 'TERMINAL' ? 'block' : 'none', height: '100%', width: '100%', flex: 1 }}>
                            {terminals.length > 0 ? (
                                terminals.map(term => (
                                    <div
                                        key={term.id}
                                        style={{
                                            display: activeTerminalId === term.id ? 'flex' : 'none',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    >
                                        {term.panes.map((pane, idx) => (
                                            <React.Fragment key={pane.id}>
                                                <div style={{ width: `${pane.width}%`, height: '100%', backgroundColor: 'var(--terminal-bg)', position: 'relative', overflow: 'hidden' }}>
                                                    <Terminal
                                                        terminalId={`${term.id}-${pane.id}`}
                                                        shell={term.shell}
                                                        cwd={workingDirectory}
                                                        isVisible={activeTab === 'TERMINAL' && activeTerminalId === term.id}
                                                    />
                                                    {term.panes.length > 1 && (
                                                        <div onClick={() => removePane(term.id, idx)} style={{ position: 'absolute', top: '8px', right: '35px', zIndex: 20, cursor: 'pointer', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px' }} className="pane-close-btn">
                                                            <X size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                                {idx < term.panes.length - 1 && (
                                                    <div onMouseDown={() => { setIsPaneResizing(true); resizingPaneIdx.current = idx; }} style={{ width: '4px', height: '100%', cursor: 'ew-resize', backgroundColor: 'var(--border)', zIndex: 10 }} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    Initializing terminal...
                                </div>
                            )}
                        </div>

                        {activeTab !== 'TERMINAL' && (
                            <div style={{ flex: 1, padding: '20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)' }}>
                                {activeTab === 'PROBLEMS' && <ProblemsView />}
                                {activeTab === 'OUTPUT' && "No output recorded."}
                                {activeTab === 'DEBUG CONSOLE' && "Console is ready."}
                                {activeTab === 'PORTS' && "No ports forwarded."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .shell-menu-item:hover { background-color: var(--accent); color: white !important; }
                .shell-menu-item:hover svg { opacity: 1 !important; color: white !important; }
                .pane-close-btn:hover { color: white !important; background-color: #ef4444 !important; }
                .terminal-entry { transition: all 0.2s; border-left: 2px solid transparent; }
                .terminal-entry.active { border-left-color: var(--accent); background-color: rgba(255,255,255,0.04) !important; }
                .terminal-entry:hover:not(.active) { background-color: rgba(255,255,255,0.02) !important; }
                
                @keyframes panelMenuIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .panel-tab { 
                    padding: 0 15px; 
                    cursor: pointer; 
                    height: 100%; 
                    display: flex; 
                    align-items: center; 
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                    color: var(--text-muted);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .panel-tab:hover { color: var(--text-primary); }
                .panel-tab.active { color: var(--text-primary); border-bottom-color: var(--accent); }
            `}</style>
        </div>
    );
};

export default Panel;
