import React, { useState } from 'react';
import {
    Database,
    Search,
    Filter,
    Download,
    Table,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Plus,
    FileSpreadsheet
} from 'lucide-react';

const DatabaseViewer = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data
    const columns = ['ID', 'NAME', 'EMAIL', 'ROLE', 'LAST_LOGIN', 'STATUS'];
    const rows = [
        { id: 1, name: 'Maya Agent', email: 'maya@stan.studio', role: 'AI Core', last: 'Now', status: 'Online' },
        { id: 2, name: 'Alice Smith', email: 'alice@example.com', role: 'Dev', last: '2h ago', status: 'Offline' },
        { id: 3, name: 'Bob Wilson', email: 'bob@tech.com', role: 'Designer', last: '1d ago', status: 'Online' },
        { id: 4, name: 'Charlie Dean', email: 'charlie@dev.net', role: 'Admin', last: '5m ago', status: 'Online' },
        { id: 5, name: 'Eve Johnson', email: 'eve@security.it', role: 'Auditor', last: '3h ago', status: 'Idle' },
    ];

    return (
        <div className="db-viewer-container" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={16} color="var(--accent)" />
                    <span>DATA VIEWER</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', opacity: 0.6 }}>
                    <RefreshCcw size={14} style={{ cursor: 'pointer' }} />
                    <Download size={14} style={{ cursor: 'pointer' }} />
                </div>
            </div>

            {/* DB Sidebar (Tables List) */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{
                    width: '180px',
                    borderRight: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-sidebar)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '12px', fontSize: '11px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>TABLES</div>
                    {['users', 'orders', 'products', 'logs', 'settings'].map(table => (
                        <div key={table} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            backgroundColor: table === 'users' ? 'var(--bg-selection)' : 'transparent',
                            color: table === 'users' ? 'var(--accent)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            <Table size={14} />
                            {table}
                        </div>
                    ))}
                    <div style={{ flex: 1 }} />
                    <div style={{
                        padding: '12px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <Plus size={14} />
                        New Table
                    </div>
                </div>

                {/* Main Content (Data Grid) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Toolbar */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        gap: '12px',
                        backgroundColor: 'var(--bg-lighter)'
                    }}>
                        <div style={{
                            flex: 1,
                            position: 'relative',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px'
                        }}>
                            <Search size={14} style={{ opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Search table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <div className="db-tool-btn"><Filter size={14} /></div>
                        <div className="db-tool-btn"><FileSpreadsheet size={14} /></div>
                    </div>

                    {/* Grid */}
                    <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#050508' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-header)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '10px' }}>
                                            {col}
                                        </th>
                                    ))}
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }} className="grid-row">
                                        <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: 'bold' }}>{row.id}</td>
                                        <td style={{ padding: '12px 16px' }}>{row.name}</td>
                                        <td style={{ padding: '12px 16px', opacity: 0.6 }}>{row.email}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontSize: '10px', backgroundColor: 'var(--bg-lighter)', padding: '2px 6px', borderRadius: '4px' }}>{row.role}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', opacity: 0.6 }}>{row.last}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: row.status === 'Online' ? '#22c55e' : row.status === 'Idle' ? '#f59e0b' : '#64748b' }}></div>
                                                {row.status}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <MoreVertical size={14} style={{ opacity: 0.3, cursor: 'pointer' }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        backgroundColor: 'var(--bg-lighter)'
                    }}>
                        <div style={{ opacity: 0.5 }}>Showing 1 - 5 of 24 records</div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="page-btn"><ChevronLeft size={14} /></div>
                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>1</span>
                            <div className="page-btn"><ChevronRight size={14} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .db-tool-btn {
                    padding: 6px;
                    border-radius: 4px;
                    background-color: var(--bg-main);
                    border: 1px solid var(--border);
                    cursor: pointer;
                    display: flex;
                    transition: all 0.2s;
                }
                .db-tool-btn:hover { border-color: var(--accent); color: var(--accent); }
                .grid-row:hover { background-color: rgba(255,255,255,0.02); }
                .page-btn { cursor: pointer; opacity: 0.5; transition: opacity 0.2s; }
                .page-btn:hover { opacity: 1; color: var(--accent); }
            `}</style>
        </div>
    );
};

export default DatabaseViewer;
