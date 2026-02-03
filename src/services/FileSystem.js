// Wrapper interface for hybrid Web / Tauri file system operations

// Helper to detect environment
const isTauri = () => (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__));

// Dynamic imports for Tauri 2.0 plugins
let tauriDialog = null;
let tauriFs = null;

if (isTauri()) {
    import('@tauri-apps/plugin-dialog').then(module => tauriDialog = module);
    import('@tauri-apps/plugin-fs').then(module => tauriFs = module);
}

export const FileSystem = {
    // Open a folder dialog
    async openFolder() {
        if (isTauri()) {
            try {
                if (!tauriDialog) {
                    console.log("[FS] Importing tauri-plugin-dialog...");
                    tauriDialog = await import('@tauri-apps/plugin-dialog');
                }
                const path = await tauriDialog.open({
                    directory: true,
                    multiple: false,
                    title: 'Select Project Folder'
                });

                if (!path) return null;

                const actualPath = Array.isArray(path) ? path[0] : path;
                console.log("[FS] Selected path:", actualPath);

                // Get name safely
                const parts = actualPath.split(/[/\\]/).filter(Boolean);
                const name = parts.length > 0 ? parts[parts.length - 1] : actualPath;

                return { type: 'native', path: actualPath, name, kind: 'directory', id: actualPath };
            } catch (err) {
                console.error("[FS] Error in openFolder:", err);
                throw new Error(`Failed to show folder picker: ${err}`);
            }
        } else {
            // Web implementation
            if (!window.showDirectoryPicker) throw new Error("File System Access API not supported in this browser.");
            const handle = await window.showDirectoryPicker();
            return { type: 'web', handle, name: handle.name, kind: 'directory', id: '' };
        }
    },

    // Scan directory contents specifically for our tree structure
    async scanDirectory(folderObject, recursive = true) {
        if (folderObject.type === 'native') {
            try {
                // Use native Rust scan for high performance
                const { invoke } = await import('@tauri-apps/api/core');
                const items = await invoke('scan_directory_native', {
                    path: folderObject.path,
                    recursive: recursive
                });

                // Recursively add type: 'native' and ensure proper structure for JS
                const mapItems = (list) => {
                    if (!Array.isArray(list)) return [];
                    return list.map(item => ({
                        ...item,
                        type: 'native',
                        path: item.path || item.id, // Ensure both are identical for native
                        children: item.children && Array.isArray(item.children) ? mapItems(item.children) : undefined
                    }));
                };

                return mapItems(items);
            } catch (err) {
                console.warn("[FS] Native scanner failed, falling back to plugin walk:", err);
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');

                const walk = async (path, depth = 0) => {
                    if (depth > 10) return [];
                    try {
                        const items = await tauriFs.readDir(path);
                        const tree = [];
                        for (const entry of items) {
                            if (entry.name.startsWith('.') && entry.name !== '.stan') continue;
                            const itemPath = `${path}/${entry.name}`;
                            const isDir = entry.isDirectory;
                            const item = { id: itemPath, name: entry.name, kind: isDir ? 'directory' : 'file', path: itemPath, type: 'native' };
                            if (isDir) item.children = await walk(itemPath, depth + 1);
                            tree.push(item);
                        }
                        return tree.sort((a, b) => {
                            if (a.kind === b.kind) return a.name.localeCompare(b.name);
                            return a.kind === 'directory' ? -1 : 1;
                        });
                    } catch {
                        // Return empty for restricted or missing folders
                        return [];
                    }
                };
                return await walk(folderObject.path);
            }
        } else {
            // Web Walk (unchanged)
            const scan = async (handle, path = "") => {
                const items = [];
                for await (const entry of handle.values()) {
                    const itemPath = path ? `${path}/${entry.name}` : entry.name;
                    const item = {
                        id: itemPath,
                        name: entry.name,
                        kind: entry.kind, // 'file' or 'directory'
                        handle: entry,
                        type: 'web'
                    };
                    if (entry.kind === 'directory') {
                        item.children = await scan(entry, itemPath);
                    }
                    items.push(item);
                }
                return items.sort((a, b) => {
                    if (a.kind === b.kind) return a.name.localeCompare(b.name);
                    return a.kind === 'directory' ? -1 : 1;
                });
            };
            return await scan(folderObject.handle);
        }
    },

    isBinary(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'pdf', 'zip', 'exe', 'dll', 'binary', 'stan-bin', 'mp4', 'mp3', 'wav'];
        return binaryExtensions.includes(ext);
    },

    async readFile(fileObject, encoding = 'utf-8') {
        if (fileObject.type === 'native') {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                // Use our safe native reader with size limits
                const content = await invoke('read_file_safe_native', { path: fileObject.path });
                if (content === "BINARY_FILE_DETECTED") {
                    throw new Error("BINARY_FILE_DETECTED");
                }
                return content;
            } catch (err) {
                if (err === "BINARY_FILE_DETECTED") throw new Error("Cannot read binary file as text.");

                console.warn("[FS] Native safe read failed, falling back to plugin:", err);
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                return await tauriFs.readTextFile(fileObject.path);
            }
        } else {
            if (fileObject.isVirtual) return fileObject.content || '';
            const file = await fileObject.handle.getFile();
            if (this.isBinary(fileObject.name)) {
                throw new Error("Cannot read binary file as text. Use readBinaryAsDataUrl instead.");
            }
            // Web File System Access API doesn't easily support other encodings 
            // without reading as buffer first
            if (encoding !== 'utf-8') {
                const buffer = await file.arrayBuffer();
                const decoder = new TextDecoder(encoding);
                return decoder.decode(buffer);
            }
            return await file.text();
        }
    },

    async readBinaryAsDataUrl(fileObject) {
        if (fileObject.type === 'native') {
            if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
            const uint8Array = await tauriFs.readFile(fileObject.path);
            const extension = fileObject.name.split('.').pop().toLowerCase();
            let mime = 'application/octet-stream';

            if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(extension)) {
                mime = `image/${extension === 'jpg' ? 'jpeg' : extension === 'svg' ? 'svg+xml' : extension}`;
            } else if (extension === 'pdf') {
                mime = 'application/pdf';
            }

            const b64 = btoa(uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), ''));
            return `data:${mime};base64,${b64}`;
        } else {
            const file = await fileObject.handle.getFile();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        }
    },

    async writeFile(fileObject, content) {
        if (fileObject.type === 'native') {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('write_file_native', { path: fileObject.path, content });
            } catch (err) {
                console.warn("[FS] Native write failed, falling back to plugin:", err);
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                // Atomic Write fallback
                const tempPath = `${fileObject.path}.tmp`;
                try {
                    await tauriFs.writeTextFile(tempPath, content);
                    await tauriFs.rename(tempPath, fileObject.path);
                } catch (innerErr) {
                    await tauriFs.writeTextFile(fileObject.path, content);
                }
            }
        } else {
            if (fileObject.isVirtual) {
                fileObject.content = content;
                return;
            }
            const writable = await fileObject.handle.createWritable();
            await writable.write(content);
            await writable.close();
        }
    },

    async rename(item, newName) {
        if (item.type === 'native') {
            if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
            const separator = item.path.includes('\\') ? '\\' : '/';
            const lastIndex = item.path.lastIndexOf(separator);
            const parentPath = item.path.substring(0, lastIndex);
            const newPath = `${parentPath}${separator}${newName}`;
            await tauriFs.rename(item.path, newPath);
            return { ...item, path: newPath, id: newPath, name: newName };
        } else {
            throw new Error("Rename is not currently supported in web mode.");
        }
    },

    async move(item, targetFolder) {
        if (item.type === 'native' && targetFolder.type === 'native') {
            if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
            const separator = targetFolder.path.includes('\\') ? '\\' : '/';
            const newPath = `${targetFolder.path}${separator}${item.name}`;
            if (item.path === newPath) return item;
            await tauriFs.rename(item.path, newPath);
            return { ...item, path: newPath, id: newPath };
        } else {
            throw new Error("Move is not currently supported in web mode.");
        }
    },

    async createDirectory(parentHandle, name) {
        if (parentHandle.type === 'native') {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                const newPath = `${parentHandle.path}/${name}`;
                await invoke('mkdir_native', { path: newPath });
                return { type: 'native', path: newPath, name, kind: 'directory', id: newPath };
            } catch (err) {
                console.warn("[FS] Native mkdir failed, falling back to plugin:", err);
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                const newPath = `${parentHandle.path}/${name}`;
                await tauriFs.mkdir(newPath);
                return { type: 'native', path: newPath, name, kind: 'directory', id: newPath };
            }
        } else {
            const handle = await parentHandle.handle.getDirectoryHandle(name, { create: true });
            const parentId = parentHandle.id !== undefined ? parentHandle.id : '';
            return { type: 'web', handle, name, kind: 'directory', id: parentId ? `${parentId}/${name}` : name };
        }
    },

    async createFile(parentHandle, name) {
        if (parentHandle.type === 'native') {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                const newPath = `${parentHandle.path}/${name}`;
                await invoke('create_file_native', { path: newPath });
                return { type: 'native', path: newPath, name, kind: 'file', id: newPath };
            } catch (err) {
                console.warn("[FS] Native create file failed, falling back to plugin:", err);
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                const newPath = `${parentHandle.path}/${name}`;
                await tauriFs.writeTextFile(newPath, "");
                return { type: 'native', path: newPath, name, kind: 'file', id: newPath };
            }
        } else {
            const handle = await parentHandle.handle.getFileHandle(name, { create: true });
            const parentId = parentHandle.id !== undefined ? parentHandle.id : '';
            return { type: 'web', handle, name, kind: 'file', id: parentId ? `${parentId}/${name}` : name };
        }
    },

    async saveFileAs(suggestedName, content) {
        if (isTauri()) {
            try {
                if (!tauriDialog) tauriDialog = await import('@tauri-apps/plugin-dialog');
                const path = await tauriDialog.save({
                    defaultPath: suggestedName,
                    title: 'Save File As'
                });

                if (!path) return null;

                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                await tauriFs.writeTextFile(path, content);

                // Get name safely
                const parts = path.split(/[/\\]/).filter(Boolean);
                const name = parts.length > 0 ? parts[parts.length - 1] : path;

                return { type: 'native', path, id: path, name, kind: 'file' };
            } catch (err) {
                console.error("[FS] Save As failed:", err);
                throw err;
            }
        } else {
            // Web implementation
            if (!window.showSaveFilePicker) {
                // Legacy download fallback
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = suggestedName;
                a.click();
                URL.revokeObjectURL(url);
                return { isVirtual: true, name: suggestedName }; // We don't get a persistent handle
            }

            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return { type: 'web', handle, name: handle.name, id: handle.name, kind: 'file' };
        }
    },

    // File Watching (Tauri only)
    async watchDirectory(path, callback) {
        if (!isTauri()) return null;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const { listen } = await import('@tauri-apps/api/event');

            console.log("[FS] Starting native Rust watcher for:", path);
            await invoke('watch_directory_native', { path });

            const unlisten = await listen('native-file-change', (event) => {
                // Event format from notify crate
                callback(event.payload);
            });

            return async () => {
                unlisten();
                await invoke('unwatch_directory_native', { path }).catch(() => { });
            };
        } catch (err) {
            console.error("[FS] Native watcher failed, falling back to plugin watcher:", err);
            try {
                if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
                if (typeof tauriFs.watch === 'function') {
                    return await tauriFs.watch(path, (event) => {
                        callback(event);
                    }, { recursive: true });
                }
            } catch (fallbackErr) {
                console.error("[FS] Watch fallback failed:", fallbackErr);
            }
            return null;
        }
    },

    // Global Search implementation
    async searchInFiles(folderObject, query, options = {}) {
        const { isRegex = false, isCaseSensitive = false, isWholeWord = false } = options;

        if (folderObject.type === 'native') {
            try {
                const { invoke } = await import('@tauri-apps/api/core');
                console.log("[FS] Starting native Rust search for:", query);
                const nativeResults = await invoke('search_in_files_native', {
                    path: folderObject.path,
                    query: query,
                    caseSensitive: isCaseSensitive,
                    wholeWord: isWholeWord,
                    isRegex: isRegex
                });

                // Convert native results to frontend grouped format
                const grouped = {};
                nativeResults.forEach(r => {
                    if (!grouped[r.file]) {
                        grouped[r.file] = {
                            file: { type: 'native', path: r.file, name: r.file.split(/[/\\]/).pop(), kind: 'file', id: r.file },
                            matches: []
                        };
                    }
                    grouped[r.file].matches.push({
                        line: r.line,
                        content: r.content,
                        col: 1, // Native search currently doesn't provide column
                        match: query
                    });
                });
                return Object.values(grouped);
            } catch (err) {
                console.warn("[FS] Native search failed, falling back to JS search:", err);
            }
        }

        const results = [];
        let regex;
        try {
            let pattern = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (isWholeWord) pattern = `\\b${pattern}\\b`;
            const flags = isCaseSensitive ? 'g' : 'gi';
            regex = new RegExp(pattern, flags);
        } catch (e) {
            console.error("[FS] Invalid search regex:", e);
            return [];
        }

        const scanAndSearch = async (item) => {
            if (item.kind === 'directory') {
                const skipDirs = ['node_modules', '.git', 'dist', 'build', '.tauri', 'venv', '__pycache__'];
                if (skipDirs.includes(item.name)) return;
                if (!item.children) item.children = await this.scanDirectory(item);
                for (const child of item.children) await scanAndSearch(child);
            } else if (item.kind === 'file') {
                try {
                    const skipExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'pdf', 'zip', 'exe', 'dll', 'binary', 'stan-bin'];
                    const ext = item.name.split('.').pop().toLowerCase();
                    if (skipExts.includes(ext)) return;
                    const content = await this.readFile(item);
                    const lines = content.split(/\r?\n/);
                    const fileMatches = [];
                    lines.forEach((line, idx) => {
                        let match;
                        while ((match = regex.exec(line)) !== null) {
                            fileMatches.push({ line: idx + 1, content: line.trim(), col: match.index + 1, match: match[0] });
                            if (!regex.global) break;
                        }
                    });
                    if (fileMatches.length > 0) results.push({ file: item, matches: fileMatches });
                } catch {
                    // Silently fail for individual file read/search errors (e.g. permission denied)
                }
            }
        };

        await scanAndSearch(folderObject);
        return results;
    }
};
