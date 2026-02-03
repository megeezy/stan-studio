import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle size={18} className="text-success" />,
        error: <AlertCircle size={18} className="text-error" />,
        warning: <AlertTriangle size={18} className="text-warning" />,
        info: <Info size={18} className="text-info" />
    };

    return (
        <div className={`toast-item ${type}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-content">{message}</div>
            <X size={14} className="toast-close" onClick={onClose} />
            <div className="toast-progress"></div>

            <style>{`
                .toast-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    background: var(--bg-glass);
                    backdrop-filter: blur(var(--backdrop-blur));
                    -webkit-backdrop-filter: blur(var(--backdrop-blur));
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px 16px;
                    min-width: 300px;
                    max-width: 450px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    margin-bottom: 10px;
                    animation: toast-slide-in 0.3s ease-out;
                    position: relative;
                    overflow: hidden;
                    z-index: 9999;
                }
                @keyframes toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .toast-icon { margin-top: 1px; }
                .toast-content { 
                    flex: 1; 
                    font-size: 13px; 
                    color: var(--text-primary);
                    line-height: 1.4;
                }
                .toast-close { 
                    cursor: pointer; 
                    opacity: 0.5; 
                    transition: opacity 0.2s; 
                    margin-top: 2px;
                }
                .toast-close:hover { opacity: 1; }
                
                .text-success { color: #10b981; }
                .text-error { color: #ef4444; }
                .text-warning { color: #f59e0b; }
                .text-info { color: #3b82f6; }

                .toast-item.error { border-left: 4px solid #ef4444; }
                .toast-item.success { border-left: 4px solid #10b981; }
                .toast-item.warning { border-left: 4px solid #f59e0b; }
                .toast-item.info { border-left: 4px solid #3b82f6; }

                .toast-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 2px;
                    background: var(--accent);
                    width: 100%;
                    animation: toast-progress-anim 5s linear forwards;
                    opacity: 0.5;
                }
                @keyframes toast-progress-anim {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
            <style>{`
                .toast-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    pointer-events: none;
                    z-index: 10000;
                }
                .toast-container > * {
                    pointer-events: auto;
                }
            `}</style>
        </div>
    );
};
