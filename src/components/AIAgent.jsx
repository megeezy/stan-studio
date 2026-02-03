import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Sparkles,
    Paperclip,
    ChevronDown,
    MoreHorizontal,
    Bot,
    User,
    Command,
    Terminal as TerminalIcon,
    History
} from 'lucide-react';

const AIAgent = ({ isOpen, onClose, activeFile, cursorPosition, style = {} }) => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: "Build with Agent\nAI responses may be inaccurate.\nIf handling customer data, disable telemetry.",
            isHeader: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Simulate AI response
        setTimeout(() => {
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I'm analyzing your current context in **${activeFile?.name || 'no active file'}**. \n\nYou asked: "${inputValue}"\n\nHow can I help you implement this?`
            };
            setMessages(prev => [...prev, aiMessage]);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <aside className="ai-agent-sidebar" style={{
            width: '300px',
            backgroundColor: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            zIndex: 100,
            ...style
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                height: '48px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--accent)" />
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>MAYA</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <History size={14} className="icon-hover" style={{ cursor: 'pointer', opacity: 0.6 }} />
                    <X size={14} className="icon-hover" onClick={onClose} style={{ cursor: 'pointer', opacity: 0.6 }} />
                </div>
            </div>

            {/* Messages Area */}
            <div className="no-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 16px',
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
                            <div style={{ opacity: 0.9 }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    margin: '0 auto',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.2)'
                                }}>
                                    <Sparkles size={32} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }} />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>Build with Agent</h2>
                                <p style={{ fontSize: '13px', opacity: 0.5, lineHeight: '1.6', maxWidth: '200px', margin: '0 auto' }}>
                                    AI responses may be inaccurate.
                                    If handling customer data, <span style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>disable telemetry</span>.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <div style={{
                                    minWidth: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    backgroundColor: msg.role === 'assistant' ? 'var(--accent)' : 'var(--bg-tab)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: msg.role === 'assistant' ? '0 0 10px var(--accent)44' : 'none'
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
                                    padding: msg.role === 'user' ? '8px 12px' : '0',
                                    borderRadius: '8px'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Context Badge */}
            {(activeFile || cursorPosition) && (
                <div style={{
                    padding: '8px 16px',
                    fontSize: '10px',
                    color: 'var(--accent)',
                    backgroundColor: 'rgba(var(--accent-rgb), 0.05)',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: 0.8
                }}>
                    <Sparkles size={10} />
                    <span style={{ fontWeight: '600' }}>AGENT CONTEXT:</span>
                    <span style={{ opacity: 0.7 }}>
                        {activeFile ? `${activeFile.name} @ Ln ${cursorPosition?.lineNumber || 1}, Col ${cursorPosition?.column || 1}` : 'Global'}
                    </span>
                </div>
            )}

            {/* Input Area */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg-sidebar)'
            }}>
                <div style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{
                            fontSize: '10px',
                            backgroundColor: 'var(--bg-tab)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}>
                            <Paperclip size={10} />
                            Add Context...
                        </div>
                    </div>

                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Describe what to build next"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            resize: 'none',
                            outline: 'none',
                            minHeight: '20px',
                            maxHeight: '150px'
                        }}
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '4px'
                    }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ fontSize: '11px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                Agent <ChevronDown size={10} />
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                Claude 3.5 Sonnet <ChevronDown size={10} />
                            </div>
                        </div>
                        <div
                            onClick={handleSend}
                            style={{
                                backgroundColor: inputValue.trim() ? 'var(--accent)' : 'transparent',
                                color: inputValue.trim() ? 'var(--bg-main)' : 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: inputValue.trim() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Send size={14} />
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    opacity: 0.4
                }}>
                    <TerminalIcon size={14} className="icon-hover" />
                    <Command size={14} className="icon-hover" />
                </div>
            </div>

            <style>{`
                .ai-agent-sidebar .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </aside>
    );
};

export default AIAgent;
