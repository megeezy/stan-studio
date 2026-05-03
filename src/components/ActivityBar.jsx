import React, { useState } from 'react';
import {
    Files,
    Search, GitGraph, Play, LayoutGrid, Settings, User, ChevronRight, Brain, Layers,
    Database, Globe
} from 'lucide-react';

const ActivityBar = ({ activeView, onSwitchView, onOpenSettings }) => {
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const navItems = [
        { id: 'EXPLORER', icon: Files },
        { id: 'SEARCH', icon: Search },
        { id: 'GIT', icon: GitGraph },
        { id: 'DATABASE', icon: Database },
        { id: 'API', icon: Globe },
        { id: 'RUN', icon: Play },
        { id: 'EXTENSIONS', icon: LayoutGrid },
        { id: 'MODELS', icon: Brain },
        { id: 'CANVAS', icon: Layers },
    ];


    return (
        <aside className="activity-bar">
            <div className="activity-top">
                {navItems.map(({ id, icon: IconComponent }) => (
                    <div
                        key={id}
                        className={`activity-item ${activeView === id ? 'active' : ''}`}
                        onClick={() => onSwitchView(id)}
                    >
                        {React.createElement(IconComponent, {
                            size: 24,
                            strokeWidth: 1.5,
                            color: 'currentColor'
                        })}
                    </div>
                ))}
            </div>

            <div className="activity-bottom">
                <div
                    className={`activity-item ${showAccountMenu ? 'active' : ''}`}
                    onClick={() => { setShowAccountMenu(!showAccountMenu); }}
                >
                    <User size={24} strokeWidth={1.5} />
                </div>
                <div
                    className="activity-item"
                    onClick={() => { onOpenSettings('Commonly Used'); setShowAccountMenu(false); }}
                >
                    <Settings size={24} strokeWidth={1.5} />
                </div>
            </div>

            {/* Account Menu */}
            {showAccountMenu && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99 }}
                        onClick={() => setShowAccountMenu(false)}
                    ></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '90px', // Above settings icon
                        left: '50px',
                        width: '220px',
                        backgroundColor: 'var(--bg-popup)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        padding: '8px 0'
                    }}>
                        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                            You are not signed in to any accounts.
                        </div>
                        <div className="menu-item" style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}>
                            Sign in to Sync Settings...
                        </div>
                        <div className="menu-item" style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}>
                            Turn on Cloud Changes...
                        </div>
                    </div>
                </>
            )}
            <style>{`
                .menu-item:hover {
                    background-color: var(--bg-selection);
                }
            `}</style>
        </aside>
    );
};

export default ActivityBar;
