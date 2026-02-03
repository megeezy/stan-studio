import React from 'react';
import stanLogo from '../assets/stan-logo.png';
import { useTheme } from '../hooks/useTheme';

const Loader = () => {
    const themeContext = useTheme();
    const { theme, themes } = themeContext || { theme: 'cosmic', themes: [] };

    if (!themeContext) {
        console.error("[Loader] ThemeContext is missing!");
    }

    // Calculate background based on theme
    const getLoaderBg = () => {
        if (theme === 'custom') {
            // Always return a solid color for the loader to prevent transparency issues during load
            // We can read the CSS variable directly or fallback? 
            // Better: Read from localStorage directly here since context might be initializing? 
            // Actually context is ready. But ThemeContext sets --wp-bg to transparent for video.
            // So we should try to grab the stored opaque color if possible, or just default to black/dark.
            const saved = localStorage.getItem('stan-studio-custom-colors');
            if (saved) {
                const c = JSON.parse(saved);
                return c.bg; // This is the OPAQUE extracted color
            }
            return '#13131a';
        }
        // Find theme color
        const t = themes.find(x => x.id === theme);
        return t ? t.color : 'var(--bg-main)'; // t.color is the accent, not bg. 
        // Actually for standard themes, var(--bg-main) is fine as it is opaque.
    };

    return (
        <div className="loader-screen" style={{ backgroundColor: theme === 'custom' ? getLoaderBg() : 'var(--bg-main)' }}>
            <img
                src={stanLogo}
                alt="Loading..."
                className="loader-logo"
                style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 15px var(--accent)) brightness(1.2)'
                }}
            />
        </div>
    );
};

export default Loader;
