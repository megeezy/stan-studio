import React, { useState } from 'react';
import {
    FolderOpen,
    FilePlus,
    Terminal as TerminalIcon,
    Github,
    FileCode,
    BookOpen,
    Sparkles,
    Clock,
    Layout,
    ChevronRight,
    Check
} from 'lucide-react';
import stanLogo from '../assets/stan-logo.png';
import { useSettings } from '../hooks/useSettings';

const WelcomeScreen = ({ onOpenFolder, onNewFile, recentFolders = [], onOpenRecent, onNewWindow, onCloneRepo, onNewTerminal }) => {
    const [showAllRecent, setShowAllRecent] = useState(false);
    const { settings, updateSetting } = useSettings();

    // Limit recent folders to 4 initially to keep the UI tight and avoid scrolling
    const RECENT_LIMIT = 4;
    const displayedRecent = showAllRecent ? recentFolders : recentFolders.slice(0, RECENT_LIMIT);

    const academyItems = [
        {
            title: 'Get Started with Stan Studio',
            description: 'Learn the essentials and discover high-performance features.',
            progress: 80,
            icon: <Sparkles size={20} className="academy-icon-sparkle" />
        },
        {
            title: 'Master the Terminal',
            description: 'Configure your shell environments and native shortcuts.',
            progress: 30,
            icon: <TerminalIcon size={20} className="academy-icon-terminal" />
        },
        {
            title: 'Advanced Editor Features',
            description: 'Explore multi-cursor editing, code folding, and integrated debugging.',
            progress: 0,
            icon: <BookOpen size={20} className="academy-icon-book" />
        }
    ];

    return (
        <div className="welcome-container" style={{
            flex: 1,
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            padding: '30px 40px 20px 40px', // Reduced top padding to move logo up
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 0,
            position: 'relative'
        }}>
            <div className="welcome-content" style={{ maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px', marginTop: '0px' }}>
                    <img
                        src={stanLogo}
                        alt="Stan Logo"
                        style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 10px var(--accent)) brightness(1.2)'
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h1 style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: 0,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: 'var(--text-primary)'
                        }}>
                            Stan Studio
                        </h1>
                        <p style={{ margin: 0, opacity: 0.5, fontSize: '12px', fontWeight: '400' }}>your own workspace.</p>
                    </div>
                </div>

                <div className="welcome-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
                    gap: '60px',
                    width: '100%'
                }}>
                    <div className="welcome-left-col">
                        <section className="welcome-section" style={{ marginBottom: '30px' }}>
                            <h2 className="section-title">Start</h2>
                            <div className="action-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div className="action-item" onClick={onNewFile}>
                                    <span className="action-icon"><FilePlus size={16} /></span>
                                    <span className="action-label">New File...</span>
                                </div>
                                <div className="action-item" onClick={onOpenFolder}>
                                    <span className="action-icon"><FolderOpen size={16} /></span>
                                    <span className="action-label">Open Folder...</span>
                                </div>
                                <div className="action-item" onClick={onNewWindow}>
                                    <span className="action-icon"><Layout size={16} /></span>
                                    <span className="action-label">New Window</span>
                                </div>
                                <div className="action-item" onClick={onNewTerminal}>
                                    <span className="action-icon"><TerminalIcon size={16} /></span>
                                    <span className="action-label">Open Terminal</span>
                                </div>
                                <div className="action-item" onClick={onCloneRepo}>
                                    <span className="action-icon"><Github size={16} /></span>
                                    <span className="action-label">Clone Repository</span>
                                </div>
                            </div>
                        </section>

                        <section className="welcome-section">
                            <h2 className="section-title">Recent</h2>
                            <div className="recent-list">
                                {recentFolders.length > 0 ? (
                                    <>
                                        {displayedRecent.map((folder, idx) => (
                                            <div key={idx} className="recent-item" onClick={() => onOpenRecent(folder)}>
                                                <div className="recent-name">{folder.name}</div>
                                                <div className="recent-path">{folder.path}</div>
                                            </div>
                                        ))}
                                        {!showAllRecent && recentFolders.length > RECENT_LIMIT && (
                                            <div
                                                onClick={() => setShowAllRecent(true)}
                                                style={{
                                                    fontSize: '11px',
                                                    color: 'var(--accent)',
                                                    cursor: 'pointer',
                                                    marginTop: '4px',
                                                    opacity: 0.8
                                                }}
                                            >
                                                See more...
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-recent">You have no recent projects</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="welcome-right-col">
                        <section className="welcome-section">
                            <h2 className="section-title">Walkthroughs</h2>
                            <div className="academy-list" style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
                                {academyItems.map((item, idx) => (
                                    <div key={idx} className="academy-card" style={{
                                        padding: '16px',
                                        backgroundColor: 'var(--bg-sidebar)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer'
                                    }}>
                                        <div className="academy-card-header" style={{ gap: '14px', display: 'flex', alignItems: 'flex-start' }}>
                                            <div className="academy-icon-box" style={{
                                                padding: '8px',
                                                backgroundColor: 'var(--bg-main)',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {item.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                                                <div style={{ fontSize: '11px', opacity: 0.6, lineHeight: '1.4' }}>{item.description}</div>
                                            </div>
                                        </div>
                                        <div className="academy-progress" style={{ marginTop: '16px' }}>
                                            <div style={{ height: '4px', background: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${item.progress}%`,
                                                    background: 'linear-gradient(90deg, var(--accent) 0%, #4ade80 100%)',
                                                    borderRadius: '2px'
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Footer with "Show welcome page" checkbox */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: 0.6
            }}
                onClick={() => updateSetting('showWelcomePage', !settings.showWelcomePage)}
                className="welcome-footer"
            >
                <div style={{
                    width: '16px',
                    height: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: settings.showWelcomePage ? 'var(--accent)' : 'transparent',
                    borderColor: settings.showWelcomePage ? 'var(--accent)' : 'var(--border)'
                }}>
                    {settings.showWelcomePage && <Check size={12} color="var(--bg-main)" />}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show welcome page on startup</span>
            </div>

            <style>{`
                .welcome-container { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .section-title { font-size: 13px; font-weight: 600; margin-bottom: 20px; color: var(--text-primary); opacity: 0.9; }
                .action-list { display: flex; flex-direction: column; gap: 8px; }
                .action-item { display: flex; alignItems: center; gap: 12px; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
                .action-item:hover { background: var(--bg-selection); }
                .action-item:hover .action-label { color: var(--accent); }
                .action-icon { display: flex; alignItems: center; color: var(--text-muted); }
                .action-label { font-size: 13px; color: var(--text-secondary); }
                .recent-list { display: flex; flex-direction: column; gap: 16px; }
                .recent-item { cursor: pointer; transition: all 0.2s; }
                .recent-item:hover .recent-name { color: var(--accent); }
                .recent-name { font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 2px; }
                .recent-path { font-size: 11px; opacity: 0.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px; }
                .academy-card:hover { border-color: var(--accent) !important; transform: scale(1.01); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                .welcome-footer:hover { opacity: 1 !important; transform: translateY(-2px); background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
};

export default WelcomeScreen;
