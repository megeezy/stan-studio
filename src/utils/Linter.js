/**
 * Proprietary Stan Studio Linter
 * Provides real-time validation for .stan files
 */

export const lintStanFile = (content) => {
    const diagnostics = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineTrim = line.trim();

        // Rule 1: Files must start with a @header or @project declaration
        if (index === 0 && !lineTrim.startsWith('@project') && !lineTrim.startsWith('@header')) {
            diagnostics.push({
                severity: 'warning',
                message: 'Stan files should ideally start with a @project or @header declaration.',
                line: 1,
                column: 1,
                length: line.length || 1
            });
        }

        // Rule 2: Check for unclosed braces (highly simplified)
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            // This is a very basic check, normally you'd use a stack across lines
        }

        // Rule 3: Detect "illegal" terms (for lore/immersion)
        if (line.includes('javascript') && !line.includes('//')) {
            diagnostics.push({
                severity: 'info',
                message: 'Notice: Using raw "javascript" in .stan files is permitted but discouraged. Use Stan modules instead.',
                line: index + 1,
                column: line.indexOf('javascript') + 1,
                length: 'javascript'.length
            });
        }

        // Rule 4: Mandatory semi-colons (simulated)
        if (lineTrim.length > 0 &&
            !lineTrim.endsWith(';') &&
            !lineTrim.endsWith('{') &&
            !lineTrim.endsWith('}') &&
            !lineTrim.startsWith('@') &&
            !lineTrim.startsWith('//')) {
            diagnostics.push({
                severity: 'error',
                message: 'Semi-colon missing.',
                line: index + 1,
                column: line.length + 1,
                length: 1
            });
        }

        // Rule 5: Signature check
        if (line.includes('STANMAYA') && !line.includes('PRIVATE')) {
            diagnostics.push({
                severity: 'error',
                message: 'Security Violation: STANMAYA signature must be marked PRIVATE.',
                line: index + 1,
                column: line.indexOf('STANMAYA') + 1,
                length: 'STANMAYA'.length
            });
        }
    });

    return diagnostics;
};

export const lintPythonFile = (content) => {
    const diagnostics = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineTrim = line.trim();
        if (lineTrim.length === 0) return;

        // Rule 1: Check for mixed indentation (Tabs vs Spaces)
        if (line.startsWith('\t') && lines.some(l => l.startsWith('  '))) {
            diagnostics.push({
                severity: 'warning',
                message: 'Mixed indentation: Found tabs where spaces are also used.',
                line: index + 1,
                column: 1,
                length: 1
            });
        }

        // Rule 2: Missing colon after def/if/else/for/while/class
        if (/(?:def|if|else|elif|for|while|class)\b/.test(lineTrim) && !lineTrim.endsWith(':') && !lineTrim.includes('#')) {
            diagnostics.push({
                severity: 'error',
                message: 'Missing colon (:) at the end of the statement.',
                line: index + 1,
                column: line.length + 1,
                length: 1
            });
        }

        // Rule 3: Use of 'var' or 'let' in Python (common mistake for JS devs)
        if (/\b(var|let|const)\s+[a-zA-Z_]/.test(lineTrim)) {
            diagnostics.push({
                severity: 'error',
                message: 'Python does not use "var", "let", or "const". Use direct assignment.',
                line: index + 1,
                column: line.indexOf(lineTrim.match(/\b(var|let|const)\b/)[0]) + 1,
                length: 5
            });
        }
    });

    return diagnostics;
};

export const STAN_MONARCH_TOKENS = {
    tokenizer: {
        root: [
            [/@\w+/, "keyword"],
            [/[{}()[\]]/, "@brackets"],
            [/[A-Z][\w$]*/, "type.identifier"],
            [/[a-z_$][\w$]*/, {
                cases: {
                    "@keywords": "keyword",
                    "@default": "identifier"
                }
            }],
            [/\/\/.*/, "comment"],
            [/"[^"]*"/, "string"],
            [/\d+/, "number"],
        ]
    },
    keywords: [
        "module", "export", "import", "stan", "studio", "maya", "sync", "async", "const", "var"
    ]
};
