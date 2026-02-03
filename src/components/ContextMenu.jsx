import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Ensure menu stays within viewport
    const adjustedX = Math.min(x, window.innerWidth - 210);
    const adjustedY = Math.min(y, window.innerHeight - (options.length * 30 + 20));

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            aria-label="Context Menu"
            role="menu"
            style={{
                position: 'fixed',
                top: adjustedY,
                left: adjustedX,
                backgroundColor: 'var(--bg-popup)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                padding: '5px 0',
                zIndex: 9999,
                minWidth: '200px',
                animation: 'contextFadeIn 0.1s ease-out'
            }}
        >
            {options.map((option, index) => (
                option.separator ? (
                    <div key={`sep-${index}`} style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                ) : (
                    <div
                        key={option.label}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                            option.onClick();
                            onClose();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                option.onClick();
                                onClose();
                            }
                        }}
                        className="context-menu-item"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: option.danger ? '#ef4444' : 'var(--text-primary)',
                            transition: 'background 0.1s'
                        }}
                    >
                        {option.icon && <option.icon size={14} />}
                        <span style={{ flex: 1 }}>{option.label}</span>
                        {option.shortcut && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '15px' }}>
                                {option.shortcut}
                            </span>
                        )}
                    </div>
                )
            ))}
            <style>{`
                .context-menu-item:hover, .context-menu-item:focus {
                    background-color: var(--accent);
                    color: white !important;
                    outline: none;
                }
                @keyframes contextFadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default ContextMenu;
