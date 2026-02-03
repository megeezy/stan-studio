import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';

const SettingItem = ({ label, description, type, value, options, onChange }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{description}</div>
        {type === 'number' && (
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    outline: 'none',
                    width: '100px'
                }}
            />
        )}
        {type === 'text' && (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    outline: 'none',
                    width: '100%',
                    maxWidth: '300px'
                }}
            />
        )}
        {type === 'select' && (
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    outline: 'none',
                    minWidth: '200px'
                }}
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        )}
        {type === 'checkbox' && (
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
            />
        )}
    </div>
);

const SettingsPanel = ({ onClose, initialCategory = 'Commonly Used' }) => {
    const { settings, updateSetting } = useSettings();
    const { theme, setTheme, themes, wallpaper, applyCustomWallpaper } = useTheme();
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [search, setSearch] = useState('');

    const categories = [
        'Commonly Used',
        'Appearance',
        'Text Editor',
        'Workbench',
        'Features',
        'Extensions',
        'Security'
    ];

    const handleWallpaperUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            applyCustomWallpaper(file);
        }
    };

    return (
        <div className="settings-panel" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            zIndex: 100,
            position: 'relative',
            minHeight: 0
        }}>
            {/* Header omitted for brevity in chunk but included in final */}
            <div style={{
                padding: '20px 40px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '500' }}>Settings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search settings"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                backgroundColor: 'var(--bg-sidebar)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '6px 8px 6px 30px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '300px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <X size={20} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose} />
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Navigation Sidebar */}
                <div style={{
                    width: '250px',
                    borderRight: '1px solid var(--border)',
                    padding: '20px 0',
                    overflowY: 'auto'
                }}>
                    {categories.map(cat => (
                        <div
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '4px 40px',
                                fontSize: '14px',
                                color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                backgroundColor: activeCategory === cat ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                borderLeft: activeCategory === cat ? '2px solid var(--accent)' : '2px solid transparent',
                                marginBottom: '2px',
                                transition: 'all 0.1s'
                            }}
                        >
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '400', marginBottom: '32px' }}>{activeCategory}</h2>

                        {activeCategory === 'Commonly Used' && (
                            <>
                                <SettingItem
                                    label="Editor: Font Size"
                                    description="Controls the font size in pixels."
                                    type="number"
                                    value={settings.fontSize}
                                    onChange={(val) => updateSetting('fontSize', val)}
                                />
                                <SettingItem
                                    label="Editor: Font Family"
                                    description="Controls the font family."
                                    type="select"
                                    options={["'JetBrains Mono', monospace", "'Fira Code', monospace", "'Inter', sans-serif", "monospace"]}
                                    value={settings.fontFamily}
                                    onChange={(val) => updateSetting('fontFamily', val)}
                                />
                                <SettingItem
                                    label="Editor: Minimap"
                                    description="Controls whether the minimap is shown."
                                    type="checkbox"
                                    value={settings.minimap}
                                    onChange={(val) => updateSetting('minimap', val)}
                                />
                                <SettingItem
                                    label="Editor: Word Wrap"
                                    description="Controls how lines should wrap."
                                    type="select"
                                    options={['off', 'on', 'wordWrapColumn', 'bounded']}
                                    value={settings.wordWrap}
                                    onChange={(val) => updateSetting('wordWrap', val)}
                                />
                                <SettingItem
                                    label="User: Name"
                                    description="Your name for personalized greetings."
                                    type="text"
                                    value={settings.userName || 'Megas'}
                                    onChange={(val) => updateSetting('userName', val)}
                                />
                            </>
                        )}

                        {activeCategory === 'Appearance' && (
                            <>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Color Theme</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Choose the active color theme for the editor and workbench.</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        {themes.map((t) => {
                                            const themeClass = `theme-${t.id}`;
                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id)}
                                                    className={`theme-preview-card ${themeClass}`}
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        aspectRatio: '16/10',
                                                        width: '100%',
                                                        borderRadius: '6px',
                                                        border: theme === t.id ? '2px solid #3b82f6' : '1px solid var(--border)',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        fontSize: '0',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                        position: 'relative',
                                                        marginBottom: '8px'
                                                    }}>
                                                        {/* Sidebar */}
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

                                                        {/* Main Area */}
                                                        <div style={{
                                                            flex: 1,
                                                            height: '100%',
                                                            backgroundColor: 'var(--bg-main)',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}>
                                                            {/* Fake Tab Bar */}
                                                            <div style={{ height: '12px', background: 'var(--bg-tab-active)', width: '30%', marginTop: '0', borderRight: '1px solid var(--border)' }}></div>

                                                            {/* Code Content */}
                                                            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <div style={{ width: '15%', height: '4px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                                                                    <div style={{ width: '30%', height: '4px', background: 'var(--text-primary)', borderRadius: '2px' }}></div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                                                    <div style={{ width: '20%', height: '4px', background: 'var(--text-secondary)', borderRadius: '2px' }}></div>
                                                                    <div style={{ width: '25%', height: '4px', background: 'var(--accent)', borderRadius: '2px', opacity: 0.8 }}></div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                                                    <div style={{ width: '40%', height: '4px', background: 'var(--text-primary)', borderRadius: '2px' }}></div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <div style={{ width: '20%', height: '4px', background: 'var(--text-muted)', borderRadius: '2px' }}></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Active checkmark */}
                                                        {theme === t.id && (
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
                                                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-primary)', fontWeight: '500' }}>
                                                        {t.name}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Wallpaper Upload Section */}
                                    <div style={{
                                        padding: '20px',
                                        backgroundColor: 'var(--bg-sidebar)',
                                        borderRadius: '8px',
                                        border: '1px dashed var(--border)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '14px', marginBottom: '10px' }}>Custom Workbench Wallpaper</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                            Upload an image to generate a custom "Zenith" theme based on its colors.
                                        </div>
                                        <input
                                            type="file"
                                            id="wallpaper-upload"
                                            accept="image/*"
                                            onChange={handleWallpaperUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <label
                                            htmlFor="wallpaper-upload"
                                            style={{
                                                padding: '8px 20px',
                                                backgroundColor: 'var(--accent)',
                                                color: 'var(--accent-foreground)',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'inline-block'
                                            }}
                                        >
                                            Upload Wallpaper
                                        </label>
                                        {wallpaper && (
                                            <div style={{ marginTop: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                Current Wallpaper: Custom Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <SettingItem
                                    label="Workbench: Color Customizations"
                                    description="Overrides colors for the current color theme."
                                    type="select"
                                    options={['None', 'High Contrast', 'Minimalist']}
                                    value="None"
                                    onChange={() => { }}
                                />
                            </>
                        )}

                        {activeCategory === 'Text Editor' && (
                            <>
                                <SettingItem
                                    label="Editor: Line Height"
                                    description="Controls the line height."
                                    type="number"
                                    value={settings.lineHeight}
                                    onChange={(val) => updateSetting('lineHeight', val)}
                                />
                                <SettingItem
                                    label="Editor: Cursor Blinking"
                                    description="Controls the cursor animation style."
                                    type="select"
                                    options={['blink', 'smooth', 'phase', 'expand', 'solid']}
                                    value={settings.cursorBlinking}
                                    onChange={(val) => updateSetting('cursorBlinking', val)}
                                />
                                <SettingItem
                                    label="Editor: Render Whitespace"
                                    description="Controls how the editor should render whitespace characters."
                                    type="select"
                                    options={['none', 'boundary', 'selection', 'trailing', 'all']}
                                    value={settings.renderWhitespace}
                                    onChange={(val) => updateSetting('renderWhitespace', val)}
                                />
                            </>
                        )}

                        {activeCategory === 'Workbench' && (
                            <>
                                <SettingItem
                                    label="Workbench: Activity Bar Location"
                                    description="Controls the location of the activity bar."
                                    type="select"
                                    options={['left', 'right', 'top', 'bottom', 'hidden']}
                                    value="left"
                                    onChange={() => { }}
                                />
                                <SettingItem
                                    label="Workbench: Editor Tabs"
                                    description="Controls whether editor tabs are shown (always active in V1)."
                                    type="checkbox"
                                    value={true}
                                    onChange={() => { }}
                                />
                                <SettingItem
                                    label="Workbench: Status Bar Visibility"
                                    description="Controls whether the status bar is visible."
                                    type="checkbox"
                                    value={true}
                                    onChange={() => { }}
                                />
                            </>
                        )}

                        {activeCategory === 'Features' && (
                            <>
                                <SettingItem
                                    label="Terminal: Integrated Shell"
                                    description="Controls which integrated shell is used."
                                    type="select"
                                    options={['bash', 'sh', 'zsh', 'powershell', 'cmd']}
                                    value="bash"
                                    onChange={() => { }}
                                />
                                <SettingItem
                                    label="Search: Exclude Patterns"
                                    description="Configure glob patterns to exclude from searches."
                                    type="select"
                                    options={['**/node_modules', '**/dist', '**/build']}
                                    value="**/node_modules"
                                    onChange={() => { }}
                                />
                                <SettingItem
                                    label="Extensions: Auto Update"
                                    description="Controls whether extensions are automatically updated."
                                    type="checkbox"
                                    value={true}
                                    onChange={() => { }}
                                />
                            </>
                        )}

                        {(activeCategory === 'Extensions' || activeCategory === 'Security') && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                Additional settings for {activeCategory} will be added once proprietary project modules are finalized.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
