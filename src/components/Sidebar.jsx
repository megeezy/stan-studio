import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileCode,
    FileJson,
    File,
    MoreHorizontal,
    FilePlus,
    FolderPlus,
    RefreshCcw,
    MinusSquare,
    Edit2,
    Trash2,
    ExternalLink,
    Sparkles,
    Download,
    Cpu,
    Database,
    X,
    Search as SearchIcon,
    Replace,
    CaseSensitive,
    Regex,
    WholeWord,
    ReplaceAll,
    GitBranch,
    History,
    Send,
    CircleDot as CommitIcon,
} from 'lucide-react';
import { GitService } from '../services/GitService';
import { FileSystem } from '../services/FileSystem';
import DatabaseViewer from './DatabaseViewer';
import HTTPClient from './HTTPClient';

import { getProfessionalIcon } from '../utils/IconRegistry';

const EXTENSIONS_DATA = [
    { id: 'stan-engine', name: 'Stan Engine Core', publisher: 'Stan Studio', description: 'Real-time binary verification and high-performance compilation for .stan projects.', icon: '⚡', installs: '4.5M', version: 'v2.0.1', rating: 5, verified: true, category: 'Stan Studio' },
    { id: 'gravity-linter', name: 'Gravity Linter Pro', publisher: 'Stan Studio', description: 'Advanced static analysis for proprietary Stan signatures and XOR data patterns.', icon: '🧬', installs: '1.2M', version: 'v1.4.0', rating: 4.8, verified: true, category: 'Stan Studio' },
    { id: 'bio-logic', name: 'Bio Logic SDK', publisher: 'Stan Studio', description: 'Native support for Bio Logic theme development and adaptive UI reactive components.', icon: '🌿', installs: '800K', version: 'v0.9.8', rating: 4.5, verified: true, category: 'Stan Studio' },
    { id: 'copilot', name: 'GitHub Copilot', publisher: 'GitHub', description: 'Your AI pair programmer. Provides auto-complete and chat features.', icon: '🤖', installs: '15.2M', version: 'v1.156', rating: 4.7, verified: true, category: 'Programming' },
    { id: 'eslint', name: 'ESLint', publisher: 'Microsoft', description: 'Integrates ESLint JavaScript into VS Code.', icon: '📜', installs: '32.1M', version: 'v2.4.2', rating: 4.6, verified: true, category: 'Programming' },
    { id: 'prettier', name: 'Prettier', publisher: 'Prettier', description: 'Opinionated code formatter. Supports many languages.', icon: '🎨', installs: '38.5M', version: 'v10.1.0', rating: 4.9, verified: true, category: 'Programming' },
    { id: 'theme-pack', name: 'Stan Prism Theme Pack', publisher: 'Stan Studio', description: '15+ high-performance themes including Sakura Station and Obsidian.', icon: '💎', installs: '2.4M', version: 'v1.2.0', rating: 5, verified: true, category: 'Themes' },
    { id: 'cyber-dark', name: 'Cyber Dark Theme', publisher: 'Void', description: 'A high-contrast theme for the late night hacker.', icon: '🌙', installs: '120K', version: 'v0.1.2', rating: 4.2, verified: false, category: 'Themes' },
];

const MODELS_DATA = [
    { id: 'llama-3-8b', name: 'Llama 3 8B', publisher: 'Meta', description: 'The latest open-source LLM from Meta. Optimized for dialogue and general reasoning.', size: '4.7 GB', params: '8B', icon: '🦙', category: 'General', pulls: '12M', status: 'Available' },
    { id: 'mistral-7b', name: 'Mistral 7B', publisher: 'Mistral AI', description: 'A high-performance, small-footprint model. Great for coding and logic.', size: '4.1 GB', params: '7B', icon: '🌬️', category: 'General', pulls: '8M', status: 'Installed' },
    { id: 'codellama-7b', name: 'CodeLlama 7B', publisher: 'Meta', description: 'Specialized model for code generation and discussion.', size: '3.8 GB', params: '7B', icon: '💻', category: 'Programming', pulls: '5M', status: 'Available' },
];



const SidebarItem = React.memo(({ name, icon: Icon, indent, isActive, isFolder, isOpen, onClick, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop, onClose, isLoading }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            className={`sidebar-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                paddingLeft: `${indent * 12}px`,
                display: 'flex',
                alignItems: 'center',
                height: '24px',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            draggable
            onDragStart={(e) => onDragStart && onDragStart(e)}
            onDragOver={(e) => onDragOver && onDragOver(e)}
            onDragLeave={(e) => onDragLeave && onDragLeave(e)}
            onDrop={(e) => onDrop && onDrop(e)}
        >
            {isFolder && (
                <span className="arrow-icon" style={{ display: 'flex', marginRight: '4px' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
            )}
            {!isFolder && <span className="spacer" style={{ width: '18px' }}></span>}

            <span style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                {isLoading ? (
                    <RefreshCcw size={12} className="spin" style={{ color: 'var(--accent)' }} />
                ) : (
                    Icon && (typeof Icon === 'function' ? <Icon /> : Icon)
                )}
            </span>
            <span className="file-name" style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {name}
            </span>

            {onClose && (isHovered || isActive) && (
                <span
                    className="close-hover-icon"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{ padding: '2px', opacity: 0.6, display: 'flex' }}
                >
                    <X size={12} />
                </span>
            )}
        </div>
    );
});

const FileTree = React.memo(({ items, indent = 1, activeFile, onSelectItem, openFolders, onToggleFolder, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop, loadingFolders }) => {
    return (
        <>
            {items.map((item) => {
                const isFolder = item.kind === 'directory';
                const itemKey = item.id || item.path || item.name;
                const isOpen = openFolders[itemKey];

                return (
                    <React.Fragment key={itemKey}>
                        <SidebarItem
                            name={item.name}
                            icon={getProfessionalIcon(item.name, item.kind, 16)}
                            indent={indent}
                            isFolder={isFolder}
                            isOpen={isOpen}
                            isActive={activeFile && activeFile.id === item.id}
                            onClick={() => isFolder ? onToggleFolder(item) : onSelectItem(item)}
                            onContextMenu={(e) => onContextMenu(e, item)}
                            onDragStart={(e) => onDragStart(e, item)}
                            onDragOver={(e) => onDragOver(e)}
                            onDragLeave={(e) => onDragLeave(e)}
                            onDrop={(e) => onDrop(e, item)}
                            isLoading={loadingFolders && loadingFolders[itemKey]}
                        />
                        {isFolder && isOpen && item.children && (
                            <FileTree
                                items={item.children}
                                indent={indent + 1}
                                activeFile={activeFile}
                                onSelectItem={onSelectItem}
                                openFolders={openFolders}
                                onToggleFolder={onToggleFolder}
                                onContextMenu={onContextMenu}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                loadingFolders={loadingFolders}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
});

const ContextMenu = ({ x, y, options, onClose }) => {
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed',
            top: y,
            left: x,
            backgroundColor: 'var(--bg-popup)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '4px 0',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '160px'
        }}>
            {options.map((opt, i) => (
                opt.separator ? (
                    <div key={i} style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                ) : (
                    <div
                        key={i}
                        onClick={opt.onClick}
                        style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: opt.danger ? '#f87171' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        className="context-menu-item"
                    >
                        {opt.icon && <opt.icon size={14} />}
                        {opt.label}
                    </div>
                )
            ))}
            <style>{`.context-menu-item:hover { background-color: var(--accent); color: var(--accent-foreground); }`}</style>
        </div>
    );
};

const Sidebar = ({ fileTree, activeFile, openFiles = [], onSelectItem, onCloseFile, folderHandle, onOpenFolder, onCloseFolder, view, onCreateFile, onCreateFolder, onRename, onDelete, onRefresh, onOpenDiff, onExpandFolder }) => {
    const [isExplorerOpen, setIsExplorerOpen] = useState(true);
    const [openFolders, setOpenFolders] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchOptions, setSearchOptions] = useState({
        isRegex: false,
        isCaseSensitive: false,
        isWholeWord: false
    });
    const [isReplaceOpen, setIsReplaceOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [showOpenEditorsMenu, setShowOpenEditorsMenu] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState({});



    const toggleFolder = useCallback(async (item) => {
        const key = item.id;
        const willBeOpen = !openFolders[key];

        setOpenFolders(prev => ({ ...prev, [key]: willBeOpen }));

        // If opening a folder and it has no children but is a directory, load it
        if (willBeOpen && item.kind === 'directory' && (!item.children || item.children.length === 0)) {
            if (onExpandFolder) {
                setLoadingFolders(prev => ({ ...prev, [key]: true }));
                try {
                    await onExpandFolder(item);
                } finally {
                    setLoadingFolders(prev => ({ ...prev, [key]: false }));
                }
            }
        }
    }, [openFolders, onExpandFolder]);

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e, targetItem) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const sourceItem = JSON.parse(e.dataTransfer.getData('application/json'));
        console.log(`Moving ${sourceItem.name} to ${targetItem.name}`);
        // Implementation for move logic would go here
    };

    const handleRefresh = (e) => {
        e.stopPropagation();
        onRefresh();
    };

    const handleCollapseAll = (e) => {
        e.stopPropagation();
        setOpenFolders({});
    };

    const menuOptions = contextMenu ? [
        ... (contextMenu.item?.kind === 'directory' ? [
            { label: 'New File', icon: FilePlus, onClick: () => onCreateFile(contextMenu.item) },
            { label: 'New Folder', icon: FolderPlus, onClick: () => onCreateFolder(contextMenu.item) },
            { label: 'Close Folder', icon: X, onClick: onCloseFolder },
            { separator: true },
        ] : []),
        { label: 'Rename...', icon: Edit2, onClick: () => onRename(contextMenu.item) },
        { label: 'Delete', icon: Trash2, onClick: () => onDelete(contextMenu.item), danger: true },
        { separator: true },
        { label: 'Reveal in Explorer', icon: ExternalLink, onClick: () => alert('Revealing...') },
    ] : [];

    const renderExplorer = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="sidebar-title" style={{ position: 'relative' }}>
                <span>EXPLORER</span>
                <div
                    onClick={() => setShowOpenEditorsMenu(!showOpenEditorsMenu)}
                    className="icon-hover"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <MoreHorizontal size={16} />
                </div>

                {showOpenEditorsMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '10px',
                        backgroundColor: 'var(--bg-popup)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 110,
                        minWidth: '220px',
                        padding: '4px 0'
                    }}>
                        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px', fontWeight: '700' }}>
                            OPEN EDITORS
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {openFiles.length > 0 ? (
                                openFiles.map(file => (
                                    <div
                                        key={`menu-open-${file.id}`}
                                        className="sidebar-item"
                                        onClick={() => { onSelectItem(file); setShowOpenEditorsMenu(false); }}
                                        style={{ height: '28px', padding: '0 12px', display: 'flex', alignItems: 'center' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                            {getProfessionalIcon(file.name, 'file', 14)}
                                        </div>
                                        <span style={{ marginLeft: '8px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}>{file.name}</span>
                                        <X
                                            size={12}
                                            onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }}
                                            className="icon-hover"
                                            style={{ marginLeft: '8px' }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '12px', fontSize: '11px', opacity: 0.5, textAlign: 'center' }}>No open editors</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {/* Folder Tree Section */}
                <div className="sidebar-section">
                    <div
                        className="section-header"
                        onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                        style={{ justifyContent: 'space-between', paddingRight: '12px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {isExplorerOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="font-bold" style={{ marginLeft: '4px' }}>
                                {folderHandle ? folderHandle.name.toUpperCase() : 'NO FOLDER OPEN'}
                            </span>
                        </div>
                        {folderHandle && (
                            <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                <FilePlus size={14} className="icon-hover" onClick={() => onCreateFile(folderHandle)} title="New File" />
                                <FolderPlus size={14} className="icon-hover" onClick={() => onCreateFolder(folderHandle)} title="New Folder" />
                                <RefreshCcw size={14} className="icon-hover" onClick={handleRefresh} title="Refresh Explorer" />
                                <MinusSquare size={14} className="icon-hover" onClick={handleCollapseAll} title="Collapse All Folders" />
                                <X size={14} className="icon-hover" onClick={onCloseFolder} title="Close Folder" />
                            </div>
                        )}
                    </div>
                    {isExplorerOpen && (
                        <div className="section-content" role="tree" aria-label="Project Explorer">
                            {fileTree && fileTree.length > 0 ? (
                                <FileTree
                                    items={fileTree}
                                    activeFile={activeFile}
                                    onSelectItem={onSelectItem}
                                    openFolders={openFolders}
                                    onToggleFolder={toggleFolder}
                                    onContextMenu={handleContextMenu}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    loadingFolders={loadingFolders}
                                />
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>
                                    {folderHandle ? (
                                        <span>Folder is empty</span>
                                    ) : (
                                        <button
                                            onClick={onOpenFolder}
                                            style={{
                                                backgroundColor: 'var(--accent)',
                                                color: 'var(--accent-foreground)',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >
                                            Open Folder
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Sections - Outside of scrollable area */}
            <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
                <div className="sidebar-section">
                    <div className="section-header" style={{ height: '24px' }}>
                        <ChevronRight size={14} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>OUTLINE</span>
                    </div>
                </div>
                <div className="sidebar-section">
                    <div className="section-header" style={{ height: '24px' }}>
                        <ChevronRight size={14} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>TIMELINE</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleSearch = useCallback(async () => {
        if (!searchTerm || !folderHandle) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await FileSystem.searchInFiles(folderHandle, searchTerm, searchOptions);
            setSearchResults(results);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsSearching(false);
        }
    }, [folderHandle, searchTerm, searchOptions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, searchOptions, handleSearch]);

    const handleReplaceAll = async () => {
        if (!searchTerm || !folderHandle) return;
        const confirm = window.confirm(`Replace all occurrences of "${searchTerm}" with "${replaceTerm}"?`);
        if (!confirm) return;

        setIsSearching(true);
        try {
            const results = await FileSystem.searchInFiles(folderHandle, searchTerm, searchOptions);
            for (const res of results) {
                const content = await FileSystem.readFile(res.file);
                let pattern = searchOptions.isRegex ? searchTerm : searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (searchOptions.isWholeWord) pattern = `\\b${pattern}\\b`;
                const flags = searchOptions.isCaseSensitive ? 'g' : 'gi';
                const regex = new RegExp(pattern, flags);
                const newContent = content.replace(regex, replaceTerm);
                await FileSystem.writeFile(res.file, newContent);
            }
            alert("Bulk replacement complete.");
            handleSearch(); // Refresh search
        } catch (err) {
            console.error("Replace failed:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const renderSearch = () => {
        return (
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="sidebar-title" style={{ padding: '0 0 10px 0', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>SEARCH</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div
                            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
                            style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                        >
                            {isReplaceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                flex: 1,
                                backgroundColor: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '6px 30px 6px 8px',
                                fontSize: '13px',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '5px', display: 'flex', gap: '2px' }}>
                            <button
                                onClick={() => setSearchOptions(prev => ({ ...prev, isCaseSensitive: !prev.isCaseSensitive }))}
                                title="Match Case"
                                style={{ background: searchOptions.isCaseSensitive ? 'var(--bg-selection)' : 'transparent', border: 'none', padding: '2px', cursor: 'pointer', borderRadius: '3px', color: searchOptions.isCaseSensitive ? 'var(--accent)' : 'var(--text-muted)' }}
                            >
                                <CaseSensitive size={14} />
                            </button>
                            <button
                                onClick={() => setSearchOptions(prev => ({ ...prev, isWholeWord: !prev.isWholeWord }))}
                                title="Match Whole Word"
                                style={{ background: searchOptions.isWholeWord ? 'var(--bg-selection)' : 'transparent', border: 'none', padding: '2px', cursor: 'pointer', borderRadius: '3px', color: searchOptions.isWholeWord ? 'var(--accent)' : 'var(--text-muted)' }}
                            >
                                <WholeWord size={14} />
                            </button>
                            <button
                                onClick={() => setSearchOptions(prev => ({ ...prev, isRegex: !prev.isRegex }))}
                                title="Use Regular Expression"
                                style={{ background: searchOptions.isRegex ? 'var(--bg-selection)' : 'transparent', border: 'none', padding: '2px', cursor: 'pointer', borderRadius: '3px', color: searchOptions.isRegex ? 'var(--accent)' : 'var(--text-muted)' }}
                            >
                                <Regex size={14} />
                            </button>
                        </div>
                    </div>

                    {isReplaceOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '22px' }} />
                            <input
                                type="text"
                                placeholder="Replace"
                                value={replaceTerm}
                                onChange={(e) => setReplaceTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--bg-main)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    padding: '6px 8px',
                                    fontSize: '13px',
                                    borderRadius: '4px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleReplaceAll}
                                title="Replace All"
                                style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', opacity: 0.6 }}
                            >
                                <ReplaceAll size={16} color="var(--text-primary)" />
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {isSearching ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', opacity: 0.5 }}>Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((res, i) => (
                            <div key={i} className="search-result-file" style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>
                                    <ChevronDown size={14} />
                                    <span style={{ marginLeft: '4px' }}>{res.file.name}</span>
                                    <span style={{ marginLeft: '8px', opacity: 0.4, fontSize: '11px', fontWeight: '400' }}>{res.matches.length} matches</span>
                                </div>
                                {res.matches.map((m, j) => (
                                    <div
                                        key={j}
                                        onClick={() => onSelectItem({ ...res.file, revealLine: m.line })}
                                        className="search-result-match"
                                        style={{
                                            padding: '4px 24px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        <span style={{ opacity: 0.4, marginRight: '8px' }}>{m.line}:</span>
                                        <span>{m.content}</span>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        searchTerm && <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', opacity: 0.5 }}>No results found.</div>
                    )}
                </div>
                <style>{`
                    .search-result-match:hover { background-color: var(--bg-selection); }
                `}</style>
            </div>
        );
    };

    const renderGit = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SOURCE CONTROL</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <RefreshCcw size={14} />
                        <CommitIcon size={14} />
                    </div>
                </div>

                <div style={{ padding: '10px' }}>
                    <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                        <textarea
                            placeholder="Message (Ctrl+Enter to commit on 'main')"
                            style={{
                                width: '100%',
                                minHeight: '60px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '8px',
                                fontSize: '13px',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div className="sidebar-section">
                        <div className="section-header">
                            <ChevronDown size={14} />
                            <span className="font-bold">CHANGES</span>
                            <span style={{ marginLeft: 'auto', background: 'var(--bg-tab)', padding: '0 6px', borderRadius: '10px', fontSize: '10px' }}>3</span>
                        </div>
                        <div className="section-content">
                            <div className="sidebar-item" onClick={() => onOpenDiff('src/App.jsx')}>
                                {getProfessionalIcon('App.jsx', 'file', 16)}
                                <span style={{ marginLeft: '8px', flex: 1 }}>App.jsx</span>
                                <span style={{ color: '#eab308', marginRight: '4px', fontWeight: 'bold' }}>M</span>
                            </div>
                            <div className="sidebar-item">
                                {getProfessionalIcon('index.css', 'file', 16)}
                                <span style={{ marginLeft: '8px', flex: 1 }}>index.css</span>
                                <span style={{ color: '#eab308', marginRight: '4px', fontWeight: 'bold' }}>M</span>
                            </div>
                            <div className="sidebar-item">
                                {getProfessionalIcon('Sidebar.jsx', 'file', 16)}
                                <span style={{ marginLeft: '8px', flex: 1 }}>Sidebar.jsx</span>
                                <span style={{ color: '#3b82f6', marginRight: '4px', fontWeight: 'bold' }}>U</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderExtensions = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="sidebar-title">
                    <span>EXTENSIONS</span>
                    <MoreHorizontal size={16} />
                </div>
                <div style={{ padding: '10px' }}>
                    <input
                        type="text"
                        placeholder="Search Extensions in Marketplace"
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            padding: '6px 8px',
                            fontSize: '12px',
                            borderRadius: '2px',
                            outline: 'none',
                            marginBottom: '10px'
                        }}
                    />
                </div>
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                    {EXTENSIONS_DATA.map(ext => (
                        <div key={ext.id} className="extension-card-hover" style={{ padding: '4px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', gap: '10px' }}>
                            <div style={{ fontSize: '24px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ext.icon}</div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {ext.name}
                                    {ext.verified && <Sparkles size={10} color="#3b82f6" />}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ext.description}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'var(--accent-foreground)', padding: '0 4px', borderRadius: '2px', cursor: 'pointer' }} className="install-btn">Install</span>
                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{ext.installs} downloads</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderModels = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>MODELS GALLERY</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Download size={14} />
                        <Cpu size={14} />
                    </div>
                </div>
                <div style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '2px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <SearchIcon size={12} style={{ opacity: 0.5 }} />
                            <input
                                placeholder="Search models..."
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </div>
                </div>
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                    {MODELS_DATA.map(model => (
                        <div key={model.id} className="extension-card-hover" style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                            <div style={{ fontSize: '24px', background: 'var(--bg-main)', width: '40px', height: '40px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                {model.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{model.name}</div>
                                        <div style={{ fontSize: '11px', opacity: 0.6 }}>{model.publisher} • {model.params} params</div>
                                    </div>
                                    <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: model.status === 'Installed' ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg-selection)', color: model.status === 'Installed' ? '#4ade80' : 'var(--text-primary)' }}>
                                        {model.status}
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', marginTop: '6px', lineHeight: '1.4', opacity: 0.8 }}>{model.description}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.5 }}>
                                        <Download size={10} /> {model.pulls}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.5 }}>
                                        <Database size={10} /> {model.size}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}</style>
            </div>
        );
    };

    const renderPlaceholder = (title) => (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="sidebar-title" style={{ padding: '0 0 10px 0' }}>{title}</div>
            <p style={{ fontSize: '13px' }}>This page is coming soon.</p>
        </div>
    );

    return (
        <aside className="sidebar">
            {view === 'EXPLORER' && renderExplorer()}
            {view === 'SEARCH' && renderSearch()}
            {view === 'GIT' && renderGit()}
            {view === 'DATABASE' && <DatabaseViewer />}
            {view === 'API' && <HTTPClient />}
            {view === 'RUN' && renderPlaceholder('RUN AND DEBUG')}
            {view === 'EXTENSIONS' && renderExtensions()}
            {view === 'MODELS' && renderModels()}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={menuOptions}
                    onClose={() => setContextMenu(null)}
                />
            )}
            <style>{`
                .extension-card-hover:hover { background-color: rgba(255,255,255,0.02); }
                .install-btn:hover { opacity: 0.9; }
            `}</style>
        </aside>
    );
};

export default Sidebar;
