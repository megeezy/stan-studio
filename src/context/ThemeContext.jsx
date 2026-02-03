import React, { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContextCore';
import { WallpaperStore } from '../utils/WallpaperStore';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('stan-studio-theme') || 'cosmic';
        if (saved !== 'cosmic') document.body.classList.add(`theme-${saved}`);
        return saved;
    });

    const [wallpaper, setWallpaper] = useState(null); // Load async
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem('stan-studio-custom-colors');
        return saved ? JSON.parse(saved) : { accent: '#ffffff', bg: '#1a1a1a', fg: '#000000' };
    });


    // Load custom wallpaper from IndexedDB on startup
    useEffect(() => {
        const loadWallpaper = async () => {
            try {
                const result = await WallpaperStore.getWallpaper();
                if (result) {
                    setWallpaper(URL.createObjectURL(result.blob));
                }
            } catch (err) {
                console.error("Failed to load custom wallpaper", err);
            }
        };
        // Only load if we expect a custom theme
        if (localStorage.getItem('stan-studio-theme') === 'custom') {
            loadWallpaper();
        }
    }, []);

    useEffect(() => {
        const themeClasses = [
            'theme-void', 'theme-hydro', 'theme-bio', 'theme-photon',
            'theme-flare', 'theme-pulse', 'theme-glitch', 'theme-terra',
            'theme-brew', 'theme-cortex-night', 'theme-sanguine', 'theme-zero',
            'theme-legacy', 'theme-obsidian', 'theme-sakura', 'theme-custom',
            'theme-cobalt', 'theme-tokyo', 'theme-monokai'
        ];
        document.body.classList.remove(...themeClasses);
        if (theme !== 'cosmic') document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('stan-studio-theme', theme);

        // Apply Theme Logic
        // Apply Theme Logic
        if (theme === 'custom') {
            // Apply colors immediately from stored state
            document.documentElement.style.setProperty('--wp-accent', customColors.accent);
            document.documentElement.style.setProperty('--wp-accent-fg', customColors.fg);
            document.documentElement.style.setProperty('--wp-bg', customColors.bg);

            // Apply wallpaper asset if loaded
            if (wallpaper) {
                document.documentElement.style.setProperty('--wp-url', `url(${wallpaper})`);
            }
        } else {
            document.documentElement.style.removeProperty('--wp-url');
            // Cleanup custom props just in case
            document.documentElement.style.removeProperty('--wp-bg');
            document.documentElement.style.removeProperty('--wp-accent');
            document.documentElement.style.removeProperty('--wp-accent-fg');
        }
    }, [theme, wallpaper, customColors]);

    const applyCustomWallpaper = async (file) => {

        const reader = new FileReader();
        reader.onload = async (e) => {
            const imgUrl = e.target.result;
            setWallpaper(imgUrl);

            // For images, we might still want to persist the blob for consistency, 
            // but the current extractor uses the dataURL (e.target.result).
            // Let's save the original file blob too.
            await WallpaperStore.saveWallpaper(file, 'image');
            // We don't save the dataURL to localStorage anymore to save space.

            // Basic Dynamic Color Extraction
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

                // Determine if dark or light for foreground
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                const fg = brightness > 128 ? '#000000' : '#ffffff';
                const bg = brightness > 128 ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)';

                const newColors = { accent: hex, bg, fg };
                setCustomColors(newColors);
                localStorage.setItem('stan-studio-custom-colors', JSON.stringify(newColors));
                setTheme('custom');
            };
            img.src = imgUrl;
        };
        reader.readAsDataURL(file);
    };

    const themes = [
        { id: 'cosmic', name: 'Cosmos Core (Default)', color: '#a855f7' },
        { id: 'void', name: 'Void Signature', color: '#ffffff' },
        { id: 'hydro', name: 'Hydro Engine', color: '#06b6d4' },
        { id: 'bio', name: 'Bio Logic', color: '#4ade80' },
        { id: 'photon', name: 'Photon Lab', color: '#f8f9fa' },
        { id: 'flare', name: 'Flare Horizon', color: '#f97316' },
        { id: 'pulse', name: 'Deep Pulse', color: '#38bdf8' },
        { id: 'glitch', name: 'Glitch Matrix', color: '#f0abfc' },
        { id: 'terra', name: 'Terra Canopy', color: '#22c55e' },
        { id: 'brew', name: 'Brew Module', color: '#a8a29e' },
        { id: 'cortex-night', name: 'Cortex Night', color: '#7aa2f7' },
        { id: 'sanguine', name: 'Sanguine Code', color: '#bd93f9' },
        { id: 'zero', name: 'Absolute Zero', color: '#88c0d0' },
        { id: 'legacy', name: 'Legacy Terminal', color: '#33ff33' },
        { id: 'obsidian', name: 'Rose Obsidian', color: '#ebbcba' },
        { id: 'sakura', name: 'Sakura Station', color: '#ffb7c5' },
        { id: 'cobalt', name: 'Professional Cobalt', color: '#002240' },
        { id: 'tokyo', name: 'Tokyo Night Pro', color: '#7aa2f7' },
        { id: 'monokai', name: 'Classic Monokai', color: '#a6e22e' },
        { id: 'custom', name: 'Zenith Custom (Wallpaper)', color: 'transparent' },
    ];

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes, wallpaper, applyCustomWallpaper, customColors }}>
            {children}
        </ThemeContext.Provider>
    );
};
