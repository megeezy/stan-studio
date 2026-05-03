import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Terminal as TerminalIcon,
    History,
    Settings,
    Cpu,
    Box
} from 'lucide-react';
import { Maya as MayaService } from '../services/MayaService';

const AIAgent = ({ isOpen, onClose, activeFile, folderHandle, onRunCommand, style = {} }) => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: "Maya Local Intelligence Initialized.\nI am powered by your laptop's hardware via Ollama. No API keys, no limits, 100% private.",
            isHeader: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentModel, setCurrentModel] = useState(MayaService.modelName || 'qwen2.5-coder:3b');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        MayaService.setContext({
            activeFile,
            folderHandle,
            terminalCallback: onRunCommand
        });
    }, [activeFile, folderHandle, onRunCommand]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsg
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await MayaService.sendMessage(userMsg);

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `❌ Local Engine Error: ${err.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <aside className="ai-agent-sidebar" style={{
            width: '380px',
            backgroundColor: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            zIndex: 100,
            overflow: 'hidden',
            flexShrink: 0,
            ...style
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                height: '48px',
                flexShrink: 0,
                background: 'linear-gradient(90deg, var(--bg-sidebar), rgba(var(--accent-rgb), 0.05))'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="maya-pulse-core">
                        <Cpu size={16} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>MAYA LOCAL v2.5</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <History
                        size={14}
                        className="icon-hover"
                        onClick={() => {
                            MayaService.clearHistory();
                            setMessages([{
                                id: '1',
                                role: 'assistant',
                                content: "Local memory cleared. Ready for new instructions.",
                                isHeader: true
                            }]);
                        }}
                        style={{ cursor: 'pointer', opacity: 0.6 }}
                        title="Clear Memory"
                    />
                    <Settings
                        size={14}
                        className="icon-hover"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{ cursor: 'pointer', opacity: showSettings ? 1 : 0.6, color: showSettings ? 'var(--accent)' : 'inherit' }}
                    />
                    <X size={14} className="icon-hover" onClick={onClose} style={{ cursor: 'pointer', opacity: 0.6 }} />
                </div>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
                <div style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-tab)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '12px'
                }}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px', opacity: 0.6, fontSize: '11px', fontWeight: 'bold' }}>Intelligence Engine</div>
                        <select
                            value={currentModel}
                            onChange={(e) => {
                                const model = e.target.value;
                                setCurrentModel(model);
                                MayaService.setModel(model);
                            }}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--border)',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                outline: 'none'
                            }}
                        >
                            <option value="qwen2.5-coder:3b">Qwen 2.5 Coder 3B (Best 8GB)</option>
                            <option value="qwen2.5-coder:1.5b">Qwen 2.5 Coder 1.5B (Fastest)</option>
                            <option value="deepseek-coder:6.7b">DeepSeek Coder 6.7B</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7, fontSize: '10px' }}>
                        <Box size={14} />
                        Powered by Ollama Local Inference
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="no-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.isHeader ? 'center' : 'flex-start',
                        textAlign: msg.isHeader ? 'center' : 'left'
                    }}>
                        {msg.isHeader ? (
                            <div style={{ opacity: 0.9, marginTop: '20px' }}>
                                <div className="maya-avatar-container">
                                    <Sparkles size={40} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 12px var(--accent))' }} />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-1px', color: 'var(--text-primary)' }}>Build with Maya</h2>
                                <p style={{ fontSize: '13px', opacity: 0.6, lineHeight: '1.6', maxWidth: '240px', margin: '0 auto' }}>
                                    Local Coding Intelligence.
                                    <br />
                                    <span style={{ fontSize: '10px', color: 'var(--accent)' }}>OFFLINE + PRIVATE</span>
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                gap: '14px',
                                width: '100%',
                            }}>
                                <div style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: msg.role === 'assistant' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: msg.role === 'assistant' ? '0 4px 12px var(--accent)55' : 'none'
                                }}>
                                    {msg.role === 'assistant' ? <Bot size={16} color="var(--bg-main)" /> : <User size={16} />}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    flex: 1,
                                    whiteSpace: 'pre-wrap',
                                    color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    backgroundColor: msg.role === 'user' ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    padding: msg.role === 'user' ? '10px 14px' : '0',
                                    borderRadius: '10px'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div className="maya-loading-pulse">
                            <Cpu size={16} color="var(--bg-main)" />
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '600', letterSpacing: '0.5px', color: 'var(--accent)' }}>Maya is thinking locally...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Project Context */}
            {folderHandle && (
                <div style={{
                    padding: '10px 16px',
                    fontSize: '10px',
                    color: 'var(--accent)',
                    backgroundColor: 'rgba(var(--accent-rgb), 0.05)',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Cpu size={12} />
                    <span style={{ fontWeight: '800', opacity: 0.6 }}>LOCAL ENGINE:</span>
                    <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentModel.toUpperCase()}
                    </span>
                </div>
            )}

            {/* Input Area */}
            <div style={{
                padding: '20px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg-sidebar)',
                flexShrink: 0
            }}>
                <div style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isLoading}
                        placeholder="Ask Maya locally..."
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            resize: 'none',
                            outline: 'none',
                            minHeight: '20px',
                            maxHeight: '150px',
                            lineHeight: '1.5'
                        }}
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                <Bot size={12} /> {currentModel.split(':')[0].toUpperCase()}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                <TerminalIcon size={12} /> OFFLINE
                            </div>
                        </div>
                        <div
                            onClick={handleSend}
                            style={{
                                backgroundColor: (inputValue.trim() && !isLoading) ? 'var(--accent)' : 'transparent',
                                color: (inputValue.trim() && !isLoading) ? 'var(--bg-main)' : 'var(--text-muted)',
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                cursor: (inputValue.trim() && !isLoading) ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Send size={14} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ai-agent-sidebar .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .maya-avatar-container {
                    width: 72px;
                    height: 72px;
                    background: rgba(var(--accent-rgb), 0.05);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    border: 1px solid rgba(var(--accent-rgb), 0.1);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }
                .maya-pulse-core {
                    animation: core-pulse 2s infinite ease-in-out;
                }
                .maya-loading-pulse {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: loading-pulse 1.5s infinite;
                    box-shadow: 0 0 15px var(--accent);
                }
                @keyframes core-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes loading-pulse {
                    0% { transform: scale(0.9); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.8; }
                }
            `}</style>
        </aside>
    );
};

export default AIAgent;
