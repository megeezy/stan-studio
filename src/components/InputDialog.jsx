import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const InputDialog = ({
    isOpen,
    type = 'input',
    title,
    defaultValue,
    placeholder,
    description,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    thirdOptionLabel,
    onConfirm,
    onCancel,
    onThirdOption
}) => {
    // Initialize state with defaultValue
    const [value, setValue] = useState(defaultValue || '');
    const inputRef = useRef(null);

    // This effect handles focus and selection when opening
    useEffect(() => {
        if (isOpen && type === 'input') {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, type]);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue || '');
        }
    }, [defaultValue, isOpen]);

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (type === 'input') onConfirm(value);
            else onConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', marginBottom: description ? '2px' : '0' }}>{title}</span>
                        {description && <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: '400' }}>{description}</span>}
                    </div>
                    <X size={16} onClick={onCancel} style={{ cursor: 'pointer', opacity: 0.6 }} />
                </div>
                {type === 'input' && (
                    <div className="modal-body">
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="modal-input"
                        />
                    </div>
                )}
                <div className="modal-footer">
                    {thirdOptionLabel && (
                        <button className="modal-btn secondary" onClick={onThirdOption} style={{ marginRight: 'auto' }}>
                            {thirdOptionLabel}
                        </button>
                    )}
                    <button className="modal-btn secondary" onClick={onCancel}>{cancelLabel}</button>
                    <button className="modal-btn primary" onClick={() => type === 'input' ? onConfirm(value) : onConfirm()}>
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    backdrop-filter: blur(2px);
                }
                .modal-container {
                    background: var(--bg-glass);
                    backdrop-filter: blur(var(--backdrop-blur));
                    -webkit-backdrop-filter: blur(var(--backdrop-blur));
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    width: 400px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    animation: modal-slide-in 0.2s ease-out;
                }
                @keyframes modal-slide-in {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-header {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .modal-body {
                    padding: 20px 16px;
                }
                .modal-input {
                    width: 100%;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 8px 12px;
                    color: var(--text-primary);
                    font-size: 13px;
                    outline: none;
                }
                .modal-input:focus {
                    border-color: var(--accent);
                }
                .modal-footer {
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                }
                .modal-btn {
                    padding: 6px 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .modal-btn.primary {
                    background: var(--accent);
                    color: white;
                }
                .modal-btn.primary:hover {
                    opacity: 0.9;
                }
                .modal-btn.secondary {
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border);
                }
                .modal-btn.secondary:hover {
                    background: var(--bg-hover);
                }
            `}</style>
        </div>
    );
};

export default InputDialog;
