import React, { useState } from 'react';
import {
    Send,
    Globe,
    ChevronDown,
    Plus,
    History,
    Shield,
    Zap,
    Play,
    Copy,
    Check,
    Lock
} from 'lucide-react';

const HTTPClient = () => {
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://api.github.com/repos/stan-studio/core');
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('PARAMS');

    const handleSend = async () => {
        setIsLoading(true);
        try {
            // Mock API call
            const start = Date.now();
            const res = await fetch(url);
            const data = await res.json();
            const time = Date.now() - start;

            setResponse({
                status: res.status,
                time: `${time}ms`,
                size: `${Math.round(JSON.stringify(data).length / 1024)} KB`,
                data
            });
        } catch (err) {
            setResponse({
                status: 'Error',
                time: '0ms',
                size: '0 KB',
                data: { error: err.message }
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="http-client-container" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} color="var(--accent)" />
                <span>API CLIENT</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* URL Bar */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div
                        onClick={() => {
                            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
                            const idx = methods.indexOf(method);
                            setMethod(methods[(idx + 1) % methods.length]);
                        }}
                        style={{
                            position: 'relative',
                            backgroundColor: 'var(--bg-lighter)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)' }}>{method}</span>
                        <ChevronDown size={12} style={{ marginLeft: '4px', opacity: 0.5 }} />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        style={{
                            flex: 1,
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0 16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isLoading ? <Zap size={14} className="spin" /> : <Play size={14} fill="white" />}
                        SEND
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)' }}>
                    {['PARAMS', 'HEADERS', 'BODY', 'AUTH'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '8px 0',
                                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>

                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-lighter)', borderRadius: '8px', opacity: 0.5, border: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '11px' }}>No {activeTab.toLowerCase()} configured.</span>
                </div>
            </div>

            {/* Response Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
                <div style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-lighter)'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>RESPONSE</span>
                    {response && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: response.status === 200 ? '#22c55e' : '#ef4444' }}>{response.status} OK</span>
                            <span style={{ fontSize: '11px', opacity: 0.5 }}>{response.time}</span>
                            <span style={{ fontSize: '11px', opacity: 0.5 }}>{response.size}</span>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#0a0a0f' }}>
                    {response ? (
                        <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                            {JSON.stringify(response.data, null, 2)}
                        </pre>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                            <Zap size={40} style={{ marginBottom: '12px' }} />
                            <span style={{ fontSize: '13px' }}>Ready to test your API</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default HTTPClient;
