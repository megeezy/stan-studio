const isTauri = () => (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__));

export const SettingsService = {
    async loadSettings(defaultSettings) {
        if (!isTauri()) {
            console.log("[SettingsService] Non-Tauri environment, using defaults.");
            return defaultSettings;
        }

        try {
            const { exists, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
            const path = 'settings.json';
            const fileExists = await exists(path, { baseDir: BaseDirectory.AppConfig });

            if (!fileExists) {
                return defaultSettings;
            }

            const content = await readTextFile(path, { baseDir: BaseDirectory.AppConfig });
            return { ...defaultSettings, ...JSON.parse(content) };
        } catch (err) {
            console.error("[SettingsService] Load failed:", err);
            return defaultSettings;
        }
    },

    async saveSettings(settings) {
        if (!isTauri()) return;

        try {
            const { writeTextFile, exists, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');

            // Ensure config dir exists
            if (!(await exists('', { baseDir: BaseDirectory.AppConfig }))) {
                await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
            }

            await writeTextFile('settings.json', JSON.stringify(settings, null, 4), {
                baseDir: BaseDirectory.AppConfig
            });
            console.log("[SettingsService] Settings saved.");
        } catch (err) {
            console.error("[SettingsService] Save failed:", err);
        }
    }
};
