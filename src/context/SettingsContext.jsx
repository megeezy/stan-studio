import React, { useState, useEffect, useCallback } from 'react';
import { SettingsContext } from './SettingsContextCore';
import { SettingsService } from '../services/SettingsService';

const DEFAULT_SETTINGS = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 21,
    minimap: true,
    wordWrap: 'off',
    autoSave: 'off',
    cursorBlinking: 'blink',
    renderWhitespace: 'none',
    userName: 'Megas',
    showWelcomePage: true,
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        console.log("[SettingsProvider] Attempting to load settings...");
        async function load() {
            try {
                console.log("[SettingsProvider] Awaiting SettingsService.loadSettings...");
                const saved = await SettingsService.loadSettings(DEFAULT_SETTINGS);
                console.log("[SettingsProvider] Settings loaded successfully.");
                setSettings(saved);
            } catch (err) {
                console.error("[SettingsProvider] Failed to load settings:", err);
            } finally {
                setIsLoaded(true);
            }
        }
        load();
    }, []);

    const updateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            SettingsService.saveSettings(next);
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
};

