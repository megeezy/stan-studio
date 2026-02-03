import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Check, X } from 'lucide-react';

const ThemePreview = ({ themeId, active }) => {
    const themeClass = `theme-${themeId}`;

    return (
        <div className={`theme-preview-card ${themeClass}`} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            cursor: 'pointer',
            width: '100%',
        }}>
            <div style={{
                aspectRatio: '16/10',
                width: '100%',
                borderRadius: '6px',
                border: active ? '2px solid #3b82f6' : '1px solid var(--border)',
                overflow: 'hidden',
                display: 'flex',
                fontSize: '0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                position: 'relative',
                transition: 'transform 0.2s',
            }}>
                <div style={{
                    width: '25%',
                    height: '100%',
                    backgroundColor: 'var(--bg-sidebar)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 4px',
                    gap: '4px'
                }}>
                    <div style={{ width: '60%', height: '4px', background: 'var(--text-muted)', opacity: 0.3, borderRadius: '2px' }}></div>
                    <div style={{ width: '80%', height: '4px', background: 'var(--text-muted)', opacity: 0.3, borderRadius: '2px' }}></div>
                    <div style={{ width: '50%', height: '4px', background: 'var(--text-muted)', opacity: 0.3, borderRadius: '2px' }}></div>
                </div>

                <div style={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ height: '12px', background: 'var(--bg-tab-active)', width: '30%', marginTop: '0', borderRight: '1px solid var(--border)' }}></div>
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '15%', height: '4px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                            <div style={{ width: '30%', height: '4px', background: 'var(--text-primary)', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <div style={{ width: '20%', height: '4px', background: 'var(--text-secondary)', borderRadius: '2px' }}></div>
                            <div style={{ width: '25%', height: '4px', background: 'var(--accent)', borderRadius: '2px', opacity: 0.8 }}></div>
                        </div>
                    </div>
                </div>

                {active && (
                    <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        <Check size={10} strokeWidth={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

const ThemeSelector = ({ onClose }) => {
    const { theme, setTheme, themes } = useTheme();

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 99,
                    backdropFilter: 'blur(2px)'
                }}
            />

            <div className="theme-selector-modal" style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                maxWidth: '90vw',
                height: '500px',
                maxHeight: '80vh',
                backgroundColor: 'var(--bg-popup)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-header)'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Select Color Theme</span>
                    <div
                        onClick={onClose}
                        style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                        className="close-btn"
                    >
                        <X size={18} />
                    </div>
                </div>

                <div className="theme-grid" style={{
                    padding: '20px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '20px',
                    alignContent: 'start'
                }}>
                    {themes.map((t) => (
                        <div key={t.id} onClick={() => setTheme(t.id)}>
                            <ThemePreview themeId={t.id} active={theme === t.id} />
                            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-primary)' }}>
                                {t.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .close-btn:hover { color: var(--text-primary) !important; }
                .theme-preview-card:hover > div:first-child { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            `}</style>
        </>
    );
};

export default ThemeSelector;
