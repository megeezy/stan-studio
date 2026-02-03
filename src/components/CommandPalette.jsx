import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
    const [search, setSearch] = useState('');

    const commands = [
        { id: 'open_folder', icon: 'Folder', label: 'File: Open Folder...', shortcut: 'Ctrl+K Ctrl+O' },
        { id: 'save_file', icon: 'Save', label: 'File: Save', shortcut: 'Ctrl+S' },
        { id: 'theme_selector', icon: 'Palette', label: 'Preferences: Color Theme', shortcut: 'Ctrl+K Ctrl+T' },
        { id: 'explorer', icon: 'Files', label: 'View: Show Explorer', shortcut: 'Ctrl+Shift+E' },
        { id: 'search', icon: 'Search', label: 'View: Show Search', shortcut: 'Ctrl+Shift+F' },
        { id: 'git', icon: 'GitGraph', label: 'View: Show Source Control', shortcut: 'Ctrl+Shift+G' },
        { id: 'settings', icon: 'Settings', label: 'Preferences: Open Settings', shortcut: 'Ctrl+,' },
    ];

    const filteredCommands = commands.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleClose = useCallback(() => {
        setSearch('');
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') handleClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '80px',
            zIndex: 10000,
        }} onClick={handleClose}>
            <div className="command-palette" style={{
                width: '600px',
                backgroundColor: 'var(--bg-glass)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} style={{ marginRight: '10px', color: 'var(--text-muted)' }} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                            height: '30px'
                        }}
                    />
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                    {filteredCommands.map(cmd => (
                        <div
                            key={cmd.id}
                            onClick={() => {
                                onCommand(cmd.id);
                                handleClose();
                            }}
                            style={{
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.1s'
                            }}
                            className="command-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{cmd.label}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cmd.shortcut}</span>
                        </div>
                    ))}
                    {filteredCommands.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No commands matching your search.
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        .command-item:hover {
          background-color: var(--bg-selection);
        }
      `}</style>
        </div>
    );
};

export default CommandPalette;
