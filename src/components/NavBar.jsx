import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Sun, Maximize2, Minimize2, Split, Zap } from 'lucide-react';
import stanLogo from '../assets/stan-logo.png';
// Static imports removed to prevent crashes in non-Tauri environments
// import { getCurrentWindow } from '@tauri-apps/api/window';

// Helper to check if running in Tauri environment
const isTauri = () => typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

const DropdownMenu = ({ label, items, isOpen, onOpen, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="nav-dropdown" ref={menuRef} style={{ position: 'relative' }}>
            <div
                className={`nav-item ${isOpen ? 'active' : ''}`}
                onMouseEnter={() => isOpen && onOpen()}
                onMouseDown={(e) => {
                    console.log(`[NavBar] Menu label down: ${label}`);
                    e.stopPropagation();
                    if (isOpen) onClose();
                    else onOpen();
                }}
                onPointerDown={(e) => {
                    // Added for Tauri touch/pen support and Linux window manager compatibility
                    e.stopPropagation();
                }}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    height: '100%',
                    borderRadius: '4px',
                    pointerEvents: 'auto',
                    backgroundColor: isOpen ? 'var(--bg-selection)' : 'transparent',
                    userSelect: 'none'
                }}
                data-tauri-no-drag
            >
                {label}
            </div>
            {isOpen && (
                <div className="dropdown-content">
                    {items.map((item, idx) => (
                        item.separator ? (
                            <div key={idx} className="separator" />
                        ) : item.items ? (
                            <div key={idx} className="dropdown-item has-submenu" style={{ position: 'relative' }} data-tauri-no-drag>
                                <span className="item-label">{item.label}</span>
                                <span className="item-shortcut">›</span>
                                <div className="submenu-content">
                                    {item.items.map((sub, sidx) => (
                                        <div key={sidx} className="dropdown-item" onMouseDown={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            console.log(`[NavBar] Submenu Click: ${sub.label}`);
                                            sub.onClick(); onClose();
                                        }}>
                                            {sub.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                key={idx}
                                className="dropdown-item"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(`[NavBar] MenuItem clicked: "${item.label}"`);
                                    if (item.onClick) {
                                        item.onClick();
                                    }
                                    onClose();
                                }}
                                data-tauri-no-drag
                            >
                                <span className="item-label">{item.label}</span>
                                <span className="item-shortcut">{item.shortcut}</span>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

const NavBar = ({ onNewTextFile, onNewFile, onOpenFile, onOpenFolder, onExportProject, onSaveFile, onSaveAll, onCloseFolder, onOpenSettings, onOpenCommandPalette, onOpenTerminal, onToggleTerminal, onSplitTerminal, onRunFile, folderName, activeFileName, onSaveAs, onRefresh, onNewWindow, onOpenRecent, recentFolders }) => {
    const [openMenu, setOpenMenu] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);

    // Window control handlers
    const handleMinimize = async () => {
        if (isTauri()) {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            await getCurrentWindow().minimize();
        }
    };

    const handleMaximize = async () => {
        if (isTauri()) {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const win = getCurrentWindow();
            await win.toggleMaximize();
            const maximized = await win.isMaximized();
            setIsMaximized(maximized);
        } else {
            setIsMaximized(!isMaximized);
        }
    };

    const handleClose = async () => {
        if (isTauri()) {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            await getCurrentWindow().close();
        }
    };

    const menus = {
        File: [
            { label: 'New Text File', shortcut: 'Ctrl+N', onClick: () => onNewTextFile && onNewTextFile() },
            { label: 'New File...', shortcut: 'Ctrl+Alt+Win+N', onClick: () => onNewFile && onNewFile() },
            { label: 'New Window', shortcut: 'Ctrl+Shift+N', onClick: () => onNewWindow && onNewWindow() },
            { separator: true },
            { label: 'Open File...', shortcut: 'Ctrl+O', onClick: () => onOpenFile && onOpenFile() },
            { label: 'Open Folder...', shortcut: 'Ctrl+K O', onClick: onOpenFolder },
            ...(recentFolders.length > 0 ? [{
                label: 'Open Recent',
                shortcut: '>',
                items: recentFolders.map(f => ({
                    label: f.name,
                    onClick: () => onOpenRecent(f)
                }))
            }] : []),
            { label: 'Close Folder', shortcut: 'Ctrl+K F', onClick: onCloseFolder },
            { separator: true },
            { label: 'Save', shortcut: 'Ctrl+S', onClick: onSaveFile },
            { label: 'Save As...', shortcut: 'Ctrl+Shift+S', onClick: onSaveAs },
            { label: 'Save All', shortcut: 'Ctrl+K S', onClick: onSaveAll },
            { separator: true },
            { label: 'Refresh Explorer', shortcut: 'Ctrl+R', onClick: onRefresh },
            { separator: true },
            {
                label: folderName ? `Export "${folderName}" as .stan` : 'Export Project as .stan',
                shortcut: '',
                onClick: onExportProject
            },
            { separator: true },
            { label: 'Preferences', shortcut: '', onClick: () => onOpenSettings('Commonly Used') },
            { separator: true },
            { label: 'Close Window', shortcut: 'Ctrl+Shift+W', onClick: handleClose },
            { label: 'Exit', shortcut: 'Alt+F4', onClick: handleClose },
        ],
        Edit: [
            { label: 'Undo', shortcut: 'Ctrl+Z' },
            { label: 'Redo', shortcut: 'Ctrl+Y' },
            { separator: true },
            { label: 'Cut', shortcut: 'Ctrl+X' },
            { label: 'Copy', shortcut: 'Ctrl+C' },
            { label: 'Paste', shortcut: 'Ctrl+V' },
        ],
        Selection: [
            { label: 'Select All', shortcut: 'Ctrl+A' },
            { label: 'Expand Selection', shortcut: 'Shift+Alt+Right' },
        ],
        View: [
            { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', onClick: onOpenCommandPalette },
            { separator: true },
            { label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
            { label: 'Search', shortcut: 'Ctrl+Shift+F' },
            { label: 'Terminal', shortcut: 'Ctrl+Shift+,', onClick: onToggleTerminal },
        ],
        Go: [
            { label: 'Go to File...', shortcut: 'Ctrl+P', onClick: onOpenCommandPalette },
        ],
        Run: [
            { label: 'Run Current File', shortcut: 'F5', onClick: onRunFile },
        ],
        Terminal: [
            { label: 'New Terminal', shortcut: 'Ctrl+,', onClick: onOpenTerminal },
            { label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', onClick: onSplitTerminal },
        ],
        Help: [
            { label: 'About Stan Studio', shortcut: '' },
        ]
    };

    console.log("[NavBar] Rendering. openMenu:", openMenu);

    return (
        <header
            className="navbar"
            style={{
                height: '35px',
                width: '100%',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'default',
                userSelect: 'none',
                pointerEvents: 'auto',
                backgroundColor: 'var(--bg-header)',
                borderBottom: '1px solid var(--border)',
                padding: '0 4px'
            }}
        >
            {/* Left: Branding and Menus */}
            <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', height: '100%', paddingLeft: '8px' }} data-tauri-no-drag>
                <img src={stanLogo} alt="Stan" style={{ height: '18px', width: '18px', marginRight: '8px', filter: 'drop-shadow(0 0 6px var(--accent))' }} />
                <nav className="nav-menus" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2px' }}>
                    {Object.keys(menus).map(menuLabel => (
                        <DropdownMenu
                            key={menuLabel}
                            label={menuLabel}
                            items={menus[menuLabel]}
                            isOpen={openMenu === menuLabel}
                            onOpen={() => setOpenMenu(menuLabel)}
                            onClose={() => setOpenMenu(null)}
                        />
                    ))}
                </nav>
            </div>

            {/* Center: File Persistence Indicator / Title */}
            <div className="navbar-center" style={{
                flex: '1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                pointerEvents: 'none',
                minWidth: '50px'
            }}>
                <div className="title-display" style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {activeFileName ? `${activeFileName} — ` : ''}{folderName || 'No Workspace'}
                </div>
            </div>

            {/* Right: Tools and Window Controls */}
            <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: '0 0 auto', height: '100%' }} data-tauri-no-drag>
                <div className="logo-search-trigger"
                    onMouseDown={(e) => { e.stopPropagation(); onOpenCommandPalette(); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.015)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        marginRight: '12px',
                        height: '22px'
                    }}>
                    <Search size={12} style={{ color: 'var(--text-muted)', marginRight: '6px' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Search Commands...</span>
                </div>

                <div className="nav-actions" style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <div className="action-button" onMouseDown={(e) => { e.stopPropagation(); onRunFile(); }} title="Run (F5)">
                        <Zap size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="action-button" onMouseDown={(e) => { e.stopPropagation(); onSplitTerminal(); }} title="Split Terminal">
                        <Split size={14} />
                    </div>

                    {/* Window Controls - Use traditional symbols */}
                    <div className="win-control min" onPointerDown={(e) => { e.stopPropagation(); handleMinimize(); }}>
                        <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor" /></svg>
                    </div>
                    <div className="win-control max" onPointerDown={(e) => { e.stopPropagation(); handleMaximize(); }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" /></svg>
                    </div>
                    <div className="win-control close" onPointerDown={(e) => { e.stopPropagation(); handleClose(); }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                    </div>
                </div>
            </div>

            <style>{`
                .navbar { height: 35px; background-color: var(--bg-header); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 8px; color: var(--text-secondary); font-size: 13px; z-index: 9999; }
                .navbar-left, .navbar-center, .navbar-right { min-width: 0; }
                .nav-menus { display: flex; align-items: center; }
                .nav-item { padding: 4px 8px; border-radius: 4px; cursor: pointer; user-select: none; font-size: 12px; transition: background 0.2s; }
                .nav-item:hover, .nav-item.active { background-color: var(--bg-selection); color: var(--text-primary); }
                
                .action-button { width: 30px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; color: var(--text-muted); }
                .action-button:hover { background-color: rgba(255,255,255,0.05); color: var(--text-primary); }
                
                .win-control { width: 45px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: var(--text-muted); }
                .win-control:hover { background-color: rgba(255,255,255,0.1); color: var(--text-primary); }
                .win-control.close:hover { background-color: #e81123 !important; color: white !important; }
                
                .title-display { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
                
                .dropdown-content { position: absolute; top: 100%; left: 0; min-width: 240px; background-color: var(--bg-popup); border: 1px solid var(--border); border-radius: 6px; padding: 4px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 2000; }
                .dropdown-item { padding: 4px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: var(--text-primary); font-size: 12px; }
                .dropdown-item:hover { background-color: var(--accent); color: white; }
                .dropdown-item .item-shortcut { color: var(--text-muted); font-size: 10px; margin-left: 20px; }
                .separator { height: 1px; background-color: var(--border); margin: 4px 10px; }
                .has-submenu:hover > .submenu-content { display: block; }
                .submenu-content { display: none; position: absolute; left: 100%; top: 0; min-width: 180px; background-color: var(--bg-popup); border: 1px solid var(--border); border-radius: 6px; padding: 4px 0; box-shadow: 4px 0 12px rgba(0,0,0,0.4); }
            `}</style>
        </header>
    );
};

export default NavBar;
