/**
 * SymbolIndexer.js
 * Lightweight Project-wide Symbol Indexer
 * Provides Go-to-Definition and basic Autocomplete for ANY language via regex.
 */

export const SymbolIndexer = {
    index: new Map(), // Map<word, {path, line, col, type}>
    listeners: [],

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    notify() {
        this.listeners.forEach(callback => callback(this.index));
    },

    scanFile(path, content) {
        const lines = content.split('\n');
        // Clear old entries for this path
        for (const [word, entry] of this.index.entries()) {
            if (entry.path === path) this.index.delete(word);
        }

        let added = false;
        lines.forEach((line, idx) => {
            // Regex to find potential definitions in various languages
            const patterns = [
                /\b(?:function|class|def|type|interface|trait|struct|const|let|var|id)\s+([a-zA-Z_$][\w$]*)/g,
                /\b([a-zA-Z_$][\w$]*)\s*[:=]\s*(?:function|\([^)]*\)\s*=>|async\s+function)/g,
                /^([a-zA-Z_$][\w$]*)\s*[:=]/g // Basic assignments at start of line
            ];

            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const word = match[1];
                    if (word && word.length > 2) {
                        this.index.set(word, {
                            path,
                            line: idx + 1,
                            col: line.indexOf(word) + 1,
                            type: line.includes('class') ? 'class' : line.includes('function') || line.includes('def') ? 'function' : 'variable'
                        });
                        added = true;
                    }
                }
            });
        });
        if (added) this.notify();
    },

    clearProjectSymbols() {
        this.index.clear();
        this.notify();
    },

    getDefinition(word) {
        return this.index.get(word);
    },

    getSymbols() {
        return Array.from(this.index.keys());
    }
};
