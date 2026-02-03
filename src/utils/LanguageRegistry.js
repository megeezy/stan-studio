/**
 * LanguageRegistry.js
 * Central point for adding support for new languages and their execution logic in Stan Studio.
 */

export const CUSTOM_LANGUAGES = [
    {
        id: 'stan',
        extensions: ['.stan'],
        runner: {
            command: 'node',
            args: (path) => ['--experimental-modules', path]
        }
    },
    {
        id: 'trail', // Stan's AI Training Language
        extensions: ['.trail', '.train', '.ai'],
        runner: {
            command: 'stan-engine', // Hypothetical future native engine
            args: (path) => ['run', path]
        },
        configuration: {
            comments: { lineComment: '//', blockComment: ['/*', '*/'] },
            brackets: [['{', '}'], ['[', ']'], ['(', ')']],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' }
            ]
        },
        tokens: {
            tokenizer: {
                root: [
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            'train|feed|layer|epoch|batch|learning_rate|optimizer|loss|device|gpu|cpu': 'keyword',
                            'float|int|tensor|matrix|vector|string|bool': 'type',
                            'true|false': 'boolean',
                            '@default': 'identifier'
                        }
                    }],
                    { include: '@whitespace' },
                    [/[{}()[\]]/, '@brackets'],
                    [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],
                comment: [
                    [/[^/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    ["\\*/", 'comment', '@pop'],
                    [/[/*]/, 'comment']
                ],
            }
        }
    },
    {
        id: 'system-sh',
        extensions: ['.sh', '.bash', '.zsh'],
        runner: {
            command: 'bash',
            args: (path) => [path]
        }
    }
];

export const STANDARD_LANGUAGES = {
    'javascript': { extensions: ['.js', '.jsx', '.mjs'], runner: { command: 'node', args: (p) => [p] } },
    'python': { extensions: ['.py'], runner: { command: 'python3', args: (p) => [p] } },
    'rust': { extensions: ['.rs'], runner: { command: 'cargo', args: () => ['run'] } },
    'cpp': { extensions: ['.cpp', '.cc', '.c'], runner: { command: 'g++', args: (p) => [p, '-o', 'out', '&&', './out'] } },
    'html': { extensions: ['.html'], runner: { command: 'firefox', args: (p) => [p] } },
    'css': { extensions: ['.css'], runner: null },
    'json': { extensions: ['.json'], runner: null },
    'yaml': { extensions: ['.yaml', '.yml'], runner: null },
    'markdown': { extensions: ['.md'], runner: null },
    'go': { extensions: ['.go'], runner: { command: 'go', args: (p) => ['run', p] } },
    'java': { extensions: ['.java'], runner: { command: 'java', args: (p) => [p] } },
    'typescript': { extensions: ['.ts', '.tsx'], runner: { command: 'ts-node', args: (p) => [p] } },
    'ruby': { extensions: ['.rb'], runner: { command: 'ruby', args: (p) => [p] } },
    'php': { extensions: ['.php'], runner: { command: 'php', args: (p) => [p] } },
};

export const getLanguageIdByFilename = (filename) => {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

    // Check custom registry first
    for (const lang of CUSTOM_LANGUAGES) {
        if (lang.extensions.includes(ext)) return lang.id;
    }

    // Check standard languages
    for (const [id, config] of Object.entries(STANDARD_LANGUAGES)) {
        if (config.extensions.includes(ext)) return id;
    }

    return 'plaintext';
};

export const getRunnerConfig = (filename) => {
    const langId = getLanguageIdByFilename(filename);

    // Check custom
    const custom = CUSTOM_LANGUAGES.find(l => l.id === langId);
    if (custom && custom.runner) return custom.runner;

    // Check standard
    if (STANDARD_LANGUAGES[langId] && STANDARD_LANGUAGES[langId].runner) {
        return STANDARD_LANGUAGES[langId].runner;
    }

    return null;
};
