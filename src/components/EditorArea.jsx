import React, { useRef, useEffect, useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { X, Columns, Layout, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { useDiagnostics } from '../hooks/useDiagnostics';
import { lintStanFile, lintPythonFile, STAN_MONARCH_TOKENS } from '../utils/Linter';
import { getLanguageIdByFilename, CUSTOM_LANGUAGES } from '../utils/LanguageRegistry';
import { getProfessionalIcon } from '../utils/IconRegistry';
import { LSPService } from '../services/LSPService';

const Tab = ({ id, name, active, isDirty, onSwitch, onClose, onDragStart, onDragOver, onDragLeave, onDrop }) => {
    return (
        <div
            className={`editor-tab ${active ? 'active' : ''} ${isDirty ? 'is-dirty' : ''}`}
            onClick={() => onSwitch(id)}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', id);
                onDragStart(e, id);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(e, id);
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(e, id);
            }}
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            <span className="file-icon" style={{ marginRight: '6px', display: 'flex', alignItems: 'center' }}>
                {getProfessionalIcon(name, 'file')}
            </span>
            <span className="tab-name">{name}</span>
            <div className="tab-actions">
                {isDirty ? (
                    <span className="dirty-indicator" />
                ) : (
                    <span
                        className="close-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(id);
                        }}
                    >
                        <X size={12} />
                    </span>
                )}
                {isDirty && (
                    <span
                        className="close-icon hover-only"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(id);
                        }}
                    >
                        <X size={12} />
                    </span>
                )}
            </div>
            <style>{`
                .dirty-indicator {
                    width: 8px;
                    height: 8px;
                    background-color: var(--accent);
                    border-radius: 50%;
                    margin-left: 8px;
                }
                .tab-actions {
                    display: flex;
                    align-items: center;
                    margin-left: 8px;
                }
                .editor-tab .hover-only {
                    display: none;
                }
                .editor-tab:hover .hover-only {
                    display: flex;
                }
                .editor-tab:hover .dirty-indicator {
                    display: none;
                }
                .editor-tab.drag-over {
                    border-left: 2px solid var(--accent);
                }
            `}</style>
        </div>
    );
};
const ImagePreview = ({ fileData }) => (
    <div className="image-preview-container">
        <div className="image-info">
            <span>{fileData.name}</span>
            <span className="image-meta">Image</span>
        </div>
        <div className="image-viewport">
            <img src={fileData.content} alt={fileData.name} />
        </div>
        <style>{`
            .image-preview-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: var(--bg-main);
            }
            .image-info {
                padding: 10px 20px;
                background: rgba(0,0,0,0.2);
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: var(--text-secondary);
            }
            .image-meta {
                background: var(--accent);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
            }
            .image-viewport {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: auto;
                background-image: 
                    linear-gradient(45deg, #13131a 25%, transparent 25%),
                    linear-gradient(-45deg, #13131a 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #13131a 75%),
                    linear-gradient(-45deg, transparent 75%, #13131a 75%);
                background-size: 20px 20px;
                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                background-color: #1a1a24;
            }
            .image-viewport img {
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                box-shadow: 0 0 40px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }
        `}</style>
    </div>
);

const PdfPreview = ({ fileData }) => (
    <div className="pdf-preview-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="image-info">
            <span>{fileData.name}</span>
            <span className="image-meta" style={{ backgroundColor: '#f43f5e' }}>PDF Document</span>
        </div>
        <iframe
            src={fileData.content}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={fileData.name}
        />
    </div>
);

const BinaryFilePlaceholder = ({ fileData }) => (
    <div className="binary-placeholder-container" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        gap: '20px'
    }}>
        <div style={{ fontSize: '48px', opacity: 0.5 }}>📦</div>
        <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{fileData.name}</h3>
            <p style={{ fontSize: '13px' }}>This file is binary and cannot be displayed in the editor.</p>
        </div>
        <button className="modal-btn secondary" onClick={() => window.open(fileData.content, '_blank')}>
            Open Externally
        </button>
    </div>
);

const DiffEditorWrapper = ({ fileData, settings, theme, customColors }) => {
    const editorTheme = `stan-${theme}`;
    const language = getLanguageIdByFilename(fileData.name);

    // Ensure theme consistency for diff editor when wallpaper changes
    useEffect(() => {
        if (theme === 'wallpaper' && customColors && window.monaco) {
            window.monaco.editor.defineTheme('stan-wallpaper', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': customColors.bg,
                    'editor.foreground': customColors.text,
                }
            });
        }
    }, [customColors, theme]);

    return (
        <DiffEditor
            height="100%"
            loading={null}
            original={fileData.originalContent || ''}
            modified={fileData.content || ''}
            language={language}
            theme={editorTheme}
            options={{
                minimap: { enabled: settings.minimap },
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                renderSideBySide: true,
                readOnly: true,
                automaticLayout: true,
                padding: { top: 20 },
                contextmenu: true,
            }}
        />
    );
};

const StandaloneEditor = ({ fileData, settings, theme, onSave, onContentChange, onCursorChange, customColors }) => {
    const monacoRef = useRef(null);
    const editorRef = useRef(null);
    const [content, setContent] = React.useState(fileData.content);

    // Faster file switching: reset content state when file ID changes without full remount
    const [prevId, setPrevId] = React.useState(fileData.id);
    if (fileData.id !== prevId) {
        setPrevId(fileData.id);
        setContent(fileData.content);
    }

    const editorTheme = `stan-${theme}`;
    const { updateDiagnostics } = useDiagnostics();

    // Dynamically update theme when customColors (wallpaper) change
    useEffect(() => {
        if (monacoRef.current && theme === 'wallpaper' && customColors) {
            monacoRef.current.editor.defineTheme('stan-wallpaper', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': customColors.bg,
                    'editor.foreground': customColors.text,
                    'editorLineNumber.foreground': customColors.accent + '88',
                    'editor.lineHighlightBackground': customColors.accent + '11',
                    'editor.selectionBackground': customColors.accent + '33',
                    'editor.inactiveSelectionBackground': customColors.accent + '22',
                }
            });
            monacoRef.current.editor.setTheme('stan-wallpaper');
        }
    }, [customColors, theme]);

    // Real-time linting effect for .stan files
    useEffect(() => {
        const isLintable = fileData.name.endsWith('.stan') || fileData.name.endsWith('.py');
        if (!monacoRef.current || !editorRef.current || !isLintable) {
            if (monacoRef.current && editorRef.current) {
                const model = editorRef.current.getModel();
                if (model) {
                    monacoRef.current.editor.setModelMarkers(model, 'stan-linter', []);
                    monacoRef.current.editor.setModelMarkers(model, 'python-linter', []);
                }
            }
            return;
        }

        const runLint = () => {
            const currentContent = editorRef.current?.getValue() || content;
            const isStan = fileData.name.endsWith('.stan');
            const isPython = fileData.name.endsWith('.py');

            if (!isStan && !isPython) return;

            const diagnostics = isStan ? lintStanFile(currentContent) : lintPythonFile(currentContent);
            const model = editorRef.current.getModel();

            if (model) {
                const markers = diagnostics.map(d => ({
                    startLineNumber: d.line,
                    startColumn: d.column,
                    endLineNumber: d.line,
                    endColumn: d.column + d.length,
                    message: d.message,
                    severity: d.severity === 'error' ? 8 : d.severity === 'warning' ? 4 : 1
                }));
                monacoRef.current.editor.setModelMarkers(model, isStan ? 'stan-linter' : 'python-linter', markers);
                updateDiagnostics(fileData.id, markers);
            }
        };

        const timeout = setTimeout(runLint, 500);
        return () => clearTimeout(timeout);
    }, [content, fileData.id, fileData.name, updateDiagnostics]);

    // Handle Ctrl + S
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                onSave(content);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, onSave]);

    // Handle Reveal Line
    useEffect(() => {
        if (editorRef.current && fileData.revealLine) {
            editorRef.current.revealLineInCenter(fileData.revealLine.line);
            editorRef.current.setPosition({ lineNumber: fileData.revealLine.line, column: fileData.revealLine.col || 1 });
            editorRef.current.focus();
        }
    }, [fileData.id, fileData.revealLine]);

    const handleEditorWillMount = (monaco) => {
        // Define Custom Stan Themes for Monaco
        const themes = {
            'cosmic': { base: 'vs-dark', bg: '#13131a', accent: '#a855f7' },
            'void': { base: 'vs-dark', bg: '#000000', accent: '#ffffff' },
            'hydro': { base: 'vs-dark', bg: '#0f172a', accent: '#06b6d4' },
            'bio': { base: 'vs-dark', bg: '#1a1d1a', accent: '#4ade80' },
            'photon': { base: 'vs', bg: '#ffffff', accent: '#007acc' },
            'flare': { base: 'vs-dark', bg: '#1a0f0f', accent: '#f97316' },
            'pulse': { base: 'vs-dark', bg: '#020617', accent: '#38bdf8' },
            'glitch': { base: 'vs-dark', bg: '#050505', accent: '#f0abfc' },
            'terra': { base: 'vs-dark', bg: '#06160d', accent: '#4ade80' },
            'brew': { base: 'vs-dark', bg: '#1c1917', accent: '#d6d3d1' },
            'cortex-night': { base: 'vs-dark', bg: '#1a1b26', accent: '#7aa2f7' },
            'sanguine': { base: 'vs-dark', bg: '#282a36', accent: '#bd93f9' },
            'zero': { base: 'vs-dark', bg: '#2e3440', accent: '#88c0d0' },
            'legacy': { base: 'vs-dark', bg: '#0a0e0a', accent: '#33ff33' },
            'obsidian': { base: 'vs-dark', bg: '#191724', accent: '#ebbcba' },
            'sakura': { base: 'vs-dark', bg: '#1f1519', accent: '#ffb7c5' },
            'cobalt': { base: 'vs-dark', bg: '#002240', accent: '#ff9d00' },
            'tokyo': { base: 'vs-dark', bg: '#1a1b26', accent: '#7aa2f7' },
            'monokai': { base: 'vs-dark', bg: '#272822', accent: '#a6e22e' },
        };

        Object.entries(themes).forEach(([id, config]) => {
            monaco.editor.defineTheme(`stan-${id}`, {
                base: config.base,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': config.bg,
                    'editor.lineHighlightBackground': config.base === 'vs' ? '#f3f3f3' : '#2b2b3633',
                    'editorCursor.foreground': config.accent,
                    'editor.selectionBackground': config.base === 'vs' ? '#add6ff' : '#a855f733',
                    'editorIndentGuide.background': config.base === 'vs' ? '#eeeeee' : '#2b2b36',
                    'editorIndentGuide.activeBackground': config.accent,
                }
            });
        });

        // Register custom languages from our registry
        CUSTOM_LANGUAGES.forEach(lang => {
            if (!monaco.languages.getLanguages().some(l => l.id === lang.id)) {
                monaco.languages.register({ id: lang.id });

                if (lang.tokens) {
                    monaco.languages.setMonarchTokensProvider(lang.id, lang.id === 'stan' ? STAN_MONARCH_TOKENS : lang.tokens);
                }

                if (lang.configuration) {
                    monaco.languages.setLanguageConfiguration(lang.id, lang.configuration);
                } else if (lang.id === 'stan') {
                    monaco.languages.setLanguageConfiguration('stan', {
                        surroundingPairs: [{ open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '"', close: '"' }],
                        autoClosingPairs: [{ open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '"', close: '"' }]
                    });
                }
            }
        });
    };

    const handleEditorDidMount = (editor, monaco) => {
        monacoRef.current = monaco;
        editorRef.current = editor;

        // Initialize LSP Service
        LSPService.init(monaco);

        // Efficient Resizing
        const resizeObserver = new ResizeObserver(() => {
            editor.layout();
        });
        resizeObserver.observe(editor.getDomNode().parentElement);

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            if (onCursorChange) {
                onCursorChange({
                    lineNumber: e.position.lineNumber,
                    column: e.position.column
                });
            }
        });

        return () => {
            resizeObserver.disconnect();
        };
    };

    const getLanguage = (name) => getLanguageIdByFilename(name);

    return (
        <Editor
            height="100%"
            loading={null}
            language={getLanguage(fileData.name)}
            path={fileData.id} // Use ID as path to enable Monaco's internal model caching
            value={content}
            onChange={(value) => {
                const newContent = value || '';
                setContent(newContent);
                onContentChange(fileData.id, newContent);
            }}
            theme={editorTheme}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            options={{
                minimap: { enabled: settings.minimap },
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                lineHeight: settings.lineHeight,
                wordWrap: settings.wordWrap,
                cursorBlinking: settings.cursorBlinking,
                renderWhitespace: settings.renderWhitespace,
                scrollBeyondLastLine: false,
                automaticLayout: false, // Replaced by ResizeObserver for better performance
                padding: { top: 20 },
                contextmenu: true,
                smoothScrolling: true,
                mouseWheelZoom: true,
                stickyScroll: {
                    enabled: true
                },
            }}
        />
    );
};

const EditorContent = React.memo(({ fileData, settings, theme, customColors, onSave, onContentChange, onCursorChange }) => {
    if (fileData.isDiff) {
        return <DiffEditorWrapper fileData={fileData} settings={settings} theme={theme} customColors={customColors} />;
    }
    if (fileData.isPdf) {
        return <PdfPreview fileData={fileData} />;
    }
    if (fileData.isBinary) {
        return fileData.content?.startsWith('data:image/') ? (
            <ImagePreview fileData={fileData} />
        ) : (
            <BinaryFilePlaceholder fileData={fileData} />
        );
    }
    return (
        <StandaloneEditor
            fileData={fileData}
            settings={settings}
            theme={theme}
            customColors={customColors}
            onSave={onSave}
            onContentChange={onContentChange}
            onCursorChange={onCursorChange}
        />
    );
});

const Breadcrumbs = React.memo(({ fileData }) => {
    if (!fileData || !fileData.id) return null;

    // Handle diffs or special files
    if (fileData.isDiff) return (
        <div className="breadcrumbs" style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
            Diff: {fileData.name}
        </div>
    );

    const parts = fileData.id.split(/[/\\]/).filter(Boolean);

    return (
        <div className="breadcrumbs no-scrollbar" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-main)',
            borderBottom: '1px solid var(--border)',
            gap: '4px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
        }}>
            <span style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                {getProfessionalIcon(fileData.name, 'file', 14)}
            </span>
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    <span className="breadcrumb-part" style={{ opacity: index === parts.length - 1 ? 1 : 0.7 }}>
                        {part}
                    </span>
                    {index < parts.length - 1 && <span style={{ opacity: 0.4, margin: '0 2px' }}>›</span>}
                </React.Fragment>
            ))}
        </div>
    );
});

const EditorArea = ({ fileData, openFiles, onSwitchTab, onCloseFile, onSave, onContentChange, onReorderTabs, onCursorChange }) => {
    const { theme, customColors } = useTheme();
    const { settings } = useSettings();
    const [draggedId, setDraggedId] = useState(null);
    const [splitFileId, setSplitFileId] = useState(null);
    const [splitPercent, setSplitPercent] = useState(50);
    const [isResizingSplit, setIsResizingSplit] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingSplit && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
                if (newPercent > 10 && newPercent < 90) {
                    setSplitPercent(newPercent);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizingSplit(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingSplit) {
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
    }, [isResizingSplit]);

    // Derived: ensure we only split on a valid open file
    const actualSplitId = splitFileId && openFiles.find(f => f.id === splitFileId) ? splitFileId : null;
    const splitFileData = openFiles.find(f => f.id === actualSplitId);

    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, id) => {
        e.preventDefault();

        // Add visual cue
        if (id !== draggedId) {
            e.currentTarget.classList.add('drag-over');
        }
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        // Support both state-based and dataTransfer-based dragging for robustness
        const sourceId = draggedId || e.dataTransfer.getData('text/plain');

        if (!sourceId || sourceId === targetId) {
            setDraggedId(null);
            return;
        }

        const draggedIndex = openFiles.findIndex(f => f.id === sourceId);
        const targetIndex = openFiles.findIndex(f => f.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedId(null);
            return;
        }

        const newOpenFiles = [...openFiles];
        const [draggedFile] = newOpenFiles.splice(draggedIndex, 1);
        newOpenFiles.splice(targetIndex, 0, draggedFile);

        onReorderTabs(newOpenFiles);
        setDraggedId(null);
    };

    return (
        <div className="editor-area-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="editor-tab-header" style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-lighter)' }}>
                <div className="editor-tabs" style={{ flex: 1, borderBottom: 'none' }}>
                    {openFiles.map(file => (
                        <Tab
                            key={file.id}
                            id={file.id}
                            name={file.isDiff ? `Diff: ${file.name}` : file.name}
                            active={file.id === fileData.id}
                            isDirty={file.isDirty}
                            onSwitch={onSwitchTab}
                            onClose={onCloseFile}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>
                <div className="editor-actions" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px' }}>
                    <button
                        onClick={() => setSplitFileId(actualSplitId ? null : fileData.id)}
                        className="icon-btn"
                        title="Split Editor Right"
                        style={{
                            background: actualSplitId ? 'var(--accent)' : 'transparent',
                            color: actualSplitId ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <Columns size={16} />
                    </button>
                </div>
            </div>

            <div className="editors-workspace" ref={containerRef} style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div
                    className="editor-pane main-pane"
                    style={{
                        width: splitFileData ? `${splitPercent}%` : '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0
                    }}
                >
                    <Breadcrumbs fileData={fileData} />
                    <div className="editor-container" style={{ flex: 1 }}>
                        <EditorContent
                            fileData={fileData}
                            settings={settings}
                            theme={theme}
                            customColors={customColors}
                            onSave={onSave}
                            onContentChange={onContentChange}
                            onCursorChange={onCursorChange}
                        />
                    </div>
                </div>

                {splitFileData && (
                    <>
                        <div
                            className="split-resizer"
                            onMouseDown={() => setIsResizingSplit(true)}
                            style={{
                                width: '4px',
                                cursor: 'col-resize',
                                backgroundColor: isResizingSplit ? 'var(--accent)' : 'transparent',
                                transition: 'background-color 0.2s',
                                zIndex: 10,
                                marginLeft: '-2px',
                                marginRight: '-2px'
                            }}
                        />
                        <div
                            className="editor-pane split-pane"
                            style={{
                                width: `${100 - splitPercent}%`,
                                display: 'flex',
                                flexDirection: 'column',
                                borderLeft: '1px solid var(--border)',
                                minWidth: 0
                            }}
                        >
                            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-lighter)', borderBottom: '1px solid var(--border)' }}>
                                <Breadcrumbs fileData={splitFileData} />
                                <button onClick={() => setSplitFileId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="editor-container" style={{ flex: 1 }}>
                                <EditorContent
                                    splitFileData={splitFileData}
                                    fileData={splitFileData}
                                    settings={settings}
                                    theme={theme}
                                    customColors={customColors}
                                    onSave={onSave}
                                    onContentChange={onContentChange}
                                    onCursorChange={onCursorChange}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditorArea;
