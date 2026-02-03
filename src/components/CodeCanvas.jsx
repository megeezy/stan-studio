import React, { useState, useRef, useEffect } from 'react';
import {
    Layers,
    MousePointer2,
    Plus,
    Search,
    Cpu,
    Zap,
    X,
    Code,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { SymbolIndexer } from '../services/SymbolIndexer';
import { FileSystem } from '../services/FileSystem';
import { useTheme } from '../hooks/useTheme';

const CodeCanvas = ({ isOpen, onClose, onNavigate }) => {
    const { theme } = useTheme();
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const canvasRef = useRef(null);

    // Initial population and live updates
    useEffect(() => {
        const updateNodes = () => {
            const symbols = Array.from(SymbolIndexer.index.entries());
            console.log(`[CodeCanvas] Refreshing nodes. Found ${symbols.length} symbols.`);

            const newNodes = symbols.map(([name, data], idx) => ({
                id: `node-${idx}-${name}`,
                name,
                type: data.type,
                path: data.path,
                line: data.line,
                x: 100 + (idx % 4) * 350,
                y: 100 + Math.floor(idx / 4) * 200,
                width: 240,
                height: 90
            }));

            const newConnections = [];
            for (let i = 0; i < newNodes.length; i++) {
                for (let j = i + 1; j < newNodes.length; j++) {
                    if (newNodes[i].path === newNodes[j].path && Math.random() > 0.8) {
                        newConnections.push({
                            from: newNodes[i].id,
                            to: newNodes[j].id
                        });
                    }
                }
            }

            setNodes(newNodes);
            setConnections(newConnections);
        };

        if (isOpen) {
            updateNodes();
            // Subscribe to future updates
            const unsubscribe = SymbolIndexer.subscribe(updateNodes);
            return unsubscribe;
        }
    }, [isOpen]);

    // Handle preview content
    useEffect(() => {
        let active = true;
        if (hoveredNode) {
            const fetchPreview = async () => {
                try {
                    const content = await FileSystem.readFile({ id: hoveredNode.path });
                    if (!active) return;
                    const lines = content.split('\n');
                    const start = Math.max(0, hoveredNode.line - 1);
                    const snippet = lines.slice(start, start + 8).join('\n');
                    setPreviewContent(snippet);
                } catch {
                    if (active) setPreviewContent("Error loading preview...");
                }
            };
            fetchPreview();
        } else {
            const timer = setTimeout(() => {
                if (active) setPreviewContent(null);
            }, 0);
            return () => clearTimeout(timer);
        }
        return () => { active = false; };
    }, [hoveredNode]);

    const handleMouseDown = (e) => {
        if (e.button === 0 && e.target === canvasRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(zoom + delta, 0.2), 3);
        setZoom(newZoom);
    };

    const handleNodeDoubleClick = (node) => {
        if (onNavigate) {
            onNavigate({
                id: node.path,
                name: node.path.split('/').pop(),
                kind: 'file',
                revealLine: node.line
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`code-canvas-overlay theme-${theme}`} style={{
            position: 'fixed',
            top: '48px',
            left: '48px',
            right: 0,
            bottom: '22px',
            backgroundColor: 'var(--bg-main)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'canvasFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* Header Control Bar */}
            <div style={{
                height: '48px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                backgroundColor: 'var(--bg-header)',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px var(--accent)44'
                    }}>
                        <Layers size={16} color="var(--accent-foreground)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px' }}>CODE CANVAS</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>Visual Logic Mapping</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="canvas-tool-btn active"><MousePointer2 size={14} /></div>
                        <div className="canvas-tool-btn"><Plus size={14} /></div>
                        <div className="canvas-tool-btn"><Search size={14} /></div>
                    </div>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)' }} />
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        className="canvas-exit-btn"
                    >
                        <X size={14} />
                        Exit Canvas
                    </button>
                </div>
            </div>

            {/* Interaction Area */}
            <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                style={{
                    flex: 1,
                    position: 'relative',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
                    backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
                    backgroundPosition: `${offset.x}px ${offset.y}px`,
                    backgroundColor: 'var(--bg-main)'
                }}
            >
                {nodes.length === 0 ? (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        opacity: 0.5
                    }}>
                        <AlertCircle size={48} color="var(--accent)" />
                        <div style={{ maxWidth: '300px' }}>
                            <h3 style={{ marginBottom: '8px' }}>No Symbols Indexed</h3>
                            <p style={{ fontSize: '12px' }}>Open some files in the editor to populate the Logic Canvas. We scan your files for classes, functions, and variables in real-time.</p>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        position: 'absolute',
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}>
                        {/* SVG Layer for Wires */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', pointerEvents: 'none', zIndex: 0 }}>
                            <defs>
                                <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.1" />
                                    <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            {connections.map((conn, idx) => {
                                const fromNode = nodes.find(n => n.id === conn.from);
                                const toNode = nodes.find(n => n.id === conn.to);
                                if (!fromNode || !toNode) return null;
                                const x1 = fromNode.x + fromNode.width;
                                const y1 = fromNode.y + fromNode.height / 2;
                                const x2 = toNode.x;
                                const y2 = toNode.y + toNode.height / 2;
                                const cp1x = x1 + (x2 - x1) / 2;
                                const cp2x = x1 + (x2 - x1) / 2;
                                return (
                                    <path
                                        key={idx}
                                        d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                                        fill="none"
                                        stroke="url(#wireGradient)"
                                        strokeWidth="2"
                                        className="wire-path"
                                    />
                                );
                            })}
                        </svg>

                        {nodes.map(node => (
                            <div
                                key={node.id}
                                onDoubleClick={() => handleNodeDoubleClick(node)}
                                onMouseEnter={() => setHoveredNode(node)}
                                onMouseLeave={() => setHoveredNode(null)}
                                style={{
                                    position: 'absolute',
                                    left: node.x,
                                    top: node.y,
                                    width: node.width,
                                    height: node.height,
                                    backgroundColor: hoveredNode?.id === node.id ? 'var(--bg-popup)' : 'var(--bg-sidebar)',
                                    border: hoveredNode?.id === node.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                                    borderRadius: '12px',
                                    boxShadow: hoveredNode?.id === node.id ? '0 0 30px var(--accent)33' : '0 10px 30px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 1
                                }}
                                className="canvas-node"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            padding: '6px',
                                            borderRadius: '6px',
                                            backgroundColor: node.type === 'class' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: node.type === 'class' ? '#a855f7' : '#3b82f6',
                                            display: 'flex'
                                        }}>
                                            {node.type === 'class' ? <Cpu size={14} /> : <Zap size={14} />}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.2px' }}>{node.name}</span>
                                    </div>
                                    <div style={{ opacity: 0.3 }}><ExternalLink size={12} /></div>
                                </div>
                                <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Code size={10} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {node.path.split('/').pop()} : {node.line}
                                    </span>
                                </div>

                                {/* Hover Preview Overlay */}
                                {hoveredNode?.id === node.id && previewContent && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '110%',
                                        left: 0,
                                        width: '300px',
                                        backgroundColor: 'var(--bg-popup)',
                                        border: '1px solid var(--accent)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                                        zIndex: 1000,
                                        pointerEvents: 'none',
                                        animation: 'previewSlideIn 0.2s ease-out'
                                    }}>
                                        <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Live Snippet</div>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: '11px',
                                            color: 'var(--text-secondary)',
                                            fontFamily: 'monospace',
                                            overflow: 'hidden'
                                        }}>
                                            {previewContent}
                                        </pre>
                                    </div>
                                )}

                                {/* Connectors */}
                                <div className="node-port input" />
                                <div className="node-port output" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Legend Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '30px',
                    left: '30px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-popup)',
                    opacity: 0.9,
                    backdropFilter: 'blur(15px)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 10
                }}>
                    <div style={{ fontWeight: 'bold', letterSpacing: '1px', fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>STRUCTURE LEGEND</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#a855f7' }} />
                        <span style={{ fontWeight: '600' }}>Classes & Traits</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                        <span style={{ fontWeight: '600' }}>Functions & Logic</span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                    <div style={{ opacity: 0.6, fontSize: '10px' }}>Double-click to open in Editor</div>
                </div>

                {/* View Controls */}
                <div style={{
                    position: 'absolute',
                    bottom: '30px',
                    right: '30px',
                    display: 'flex',
                    gap: '6px',
                    backgroundColor: 'var(--bg-header)',
                    padding: '6px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    zIndex: 10
                }}>
                    <div className="canvas-view-btn" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>RESET</div>
                    <div className="canvas-view-btn" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>+</div>
                    <div className="canvas-view-btn" onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))}>-</div>
                </div>
            </div>

            <style>{`
                @keyframes previewSlideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .canvas-tool-btn {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .canvas-tool-btn:hover {
                    background-color: var(--bg-selection);
                    color: var(--text-primary);
                    border-color: var(--border);
                }

                .canvas-tool-btn.active {
                    background-color: var(--accent);
                    color: var(--accent-foreground);
                    box-shadow: 0 0 15px var(--accent)66;
                }

                .canvas-exit-btn:hover {
                    background: var(--accent) !important;
                    color: var(--accent-foreground) !important;
                    box-shadow: 0 0 20px var(--accent)44;
                }

                .canvas-node:hover {
                    transform: scale(1.02);
                }

                .node-port {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: var(--bg-main);
                    border: 2px solid var(--border);
                    border-radius: 50%;
                }

                .node-port.input { top: 50%; left: -5px; transform: translateY(-50%); }
                .node-port.output { top: 50%; right: -5px; transform: translateY(-50%); }

                .canvas-view-btn {
                    padding: 6px 12px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    border-radius: 6px;
                    opacity: 0.6;
                    transition: all 0.2s;
                    color: var(--text-primary);
                }

                .canvas-view-btn:hover {
                    background-color: var(--bg-selection);
                    opacity: 1;
                    color: var(--accent);
                }

                .wire-path {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: drawWire 2s forwards ease-out;
                }

                @keyframes drawWire {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};

export default CodeCanvas;
