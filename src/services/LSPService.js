/**
 * LSPService.js
 * Universal Language Server Protocol Bridge for Stan Studio.
 * Handles Monaco registrations and communication with Tauri-based language handlers.
 */

import { FileSystem } from './FileSystem';
import { SymbolIndexer } from './SymbolIndexer';

export const LSPService = {
    monaco: null,
    isInitialized: false,

    init(monaco) {
        if (this.isInitialized) return;
        this.monaco = monaco;
        this.registerProviders();
        this.configureBuiltIns();
        this.isInitialized = true;
        console.log("[LSP] Service initialized and providers registered.");
    },

    configureBuiltIns() {
        const monaco = this.monaco;

        // Configure JS/TS built-in support for "real" autocomplete
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            allowNonTsExtensions: true,
            checkJs: true,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
        });

        // Set up extra libs if needed (e.g. for Tauri/Node APIs)
        // monaco.languages.typescript.javascriptDefaults.addExtraLib(...);
    },

    registerProviders() {
        const monaco = this.monaco;

        // 1. Completion Provider (Universal/Fallback)
        monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: () => {
                const symbols = SymbolIndexer.getSymbols();
                const suggestions = symbols.map(sym => ({
                    label: sym,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: sym,
                    detail: 'Project Symbol'
                }));
                return { suggestions };
            }
        });

        // 2. Definition Provider (Universal/Fallback)
        // We'll use a symbol-based search as a lightweight fallback for unknown languages
        const universalDefinitionProvider = {
            provideDefinition: async (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                // Try SymbolIndexer first (Global project knowledge)
                const globalDef = SymbolIndexer.getDefinition(word.word);
                if (globalDef) {
                    return {
                        uri: monaco.Uri.parse(globalDef.path), // In a real app, you'd map path to URI
                        range: new monaco.Range(globalDef.line, globalDef.col, globalDef.line, globalDef.col + word.word.length)
                    };
                }

                // For real LSP, we would call the Tauri backend here:
                // const result = await invoke('lsp_get_definition', { path: model.uri.path, word: word.word, line: position.lineNumber });

                // Lightweight Fallback: Search for the word in the current file as a 'definition' (class/function/const)
                const text = model.getValue();
                const lines = text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Very simple regex for definitions
                    const defRegex = new RegExp(`(const|let|var|function|class|def|val|var|module|export)\\s+${word.word}\\b|${word.word}\\s*[:=]`, 'g');
                    if (defRegex.test(line)) {
                        return {
                            uri: model.uri,
                            range: new monaco.Range(i + 1, line.indexOf(word.word) + 1, i + 1, line.indexOf(word.word) + word.word.length + 1)
                        };
                    }
                }
                return null;
            }
        };

        // Register the fallback for a few languages where we don't have full LSPs yet
        const supportedLangs = ['python', 'c', 'cpp', 'rust', 'go', 'java', 'php', 'ruby'];
        supportedLangs.forEach(lang => {
            monaco.languages.registerDefinitionProvider(lang, universalDefinitionProvider);

            // Register Hover Documentation (Universal Fallback)
            monaco.languages.registerHoverProvider(lang, {
                provideHover: (model, position) => {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;
                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: `**${word.word}**` },
                            { value: `Symbol found in this project.` }
                        ]
                    };
                }
            });
        });

        // 3. Diagnostics (Placeholder for real LSP)
        // For real real-time diagnostics, we would listen to a Tauri event
        // that emits markers from language servers.
    },

    /**
     * Call this when a file is opened to potentially start a sidecar for that language
     */
    async onFileOpened(path, languageId) {
        if (languageId === 'python') {
            // Check if we need to start a python lsp sidecar
            console.log(`[LSP] Potential Python LSP start for ${path}`);
        }
    }
};
