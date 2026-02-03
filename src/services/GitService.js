import { Command } from '@tauri-apps/plugin-shell';

// Check if running in Tauri
const isTauri = () => typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

export const GitService = {
    async runGitCommand(args, cwd) {
        if (!isTauri()) {
            throw new Error("Git operations are only available in the desktop version (Tauri).");
        }

        console.log(`[Git] Running: git ${args.join(' ')} in ${cwd || 'default'}`);

        try {
            const command = Command.create('git', args, { cwd });
            const output = await command.execute();

            if (output.code !== 0) {
                throw new Error(output.stderr || `Git exited with code ${output.code}`);
            }

            return output.stdout;
        } catch (err) {
            console.error("[Git] Command failed:", err);
            throw err;
        }
    },

    async clone(url, targetPath) {
        // targetPath should be the PARENT directory where the repo folder will be created
        // or the specific folder if it's empty.
        // git clone <url> <directory>
        return this.runGitCommand(['clone', url, targetPath]);
    },

    async status(cwd) {
        const output = await this.runGitCommand(['status', '--porcelain'], cwd);
        return output.split('\n').filter(Boolean).map(line => {
            const status = line.substring(0, 2);
            const file = line.substring(3);
            return { status, file };
        });
    },

    async init(cwd) {
        return this.runGitCommand(['init'], cwd);
    },

    async getCurrentBranch(cwd) {
        try {
            return (await this.runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)).trim();
        } catch {
            return 'main (initial)';
        }
    },

    async getBranches(cwd) {
        const output = await this.runGitCommand(['branch', '--format', '%(refname:short)'], cwd);
        return output.split('\n').filter(Boolean);
    },

    async checkout(branch, cwd) {
        return this.runGitCommand(['checkout', branch], cwd);
    },

    async createBranch(name, cwd) {
        return this.runGitCommand(['checkout', '-b', name], cwd);
    },

    async getHistory(cwd, limit = 50) {
        // Format: hash|parents|author|date|relativeDate|subject
        const format = '%H|%P|%an|%ad|%ar|%s';
        const output = await this.runGitCommand(['log', `-${limit}`, `--pretty=format:${format}`, '--date=short'], cwd);
        return output.split('\n').filter(Boolean).map(line => {
            const [hash, parents, author, date, relative, subject] = line.split('|');
            return {
                hash,
                parents: parents ? parents.split(' ') : [],
                author,
                date,
                relative,
                subject
            };
        });
    },

    async getDiff(file, cwd) {
        // Get diff of a file (modified but not staged)
        try {
            return await this.runGitCommand(['diff', file], cwd);
        } catch {
            return '';
        }
    },

    async getStagedDiff(file, cwd) {
        // Get diff of a staged file
        try {
            return await this.runGitCommand(['diff', '--cached', file], cwd);
        } catch {
            return '';
        }
    },

    async getFileContentAtHead(file, cwd) {
        try {
            return await this.runGitCommand(['show', `HEAD:${file}`], cwd);
        } catch {
            return '';
        }
    },

    async stageFile(file, cwd) {
        return this.runGitCommand(['add', file], cwd);
    },

    async unstageFile(file, cwd) {
        return this.runGitCommand(['reset', 'HEAD', file], cwd);
    },

    async commit(message, cwd) {
        return this.runGitCommand(['commit', '-m', message], cwd);
    },

    async fetch(cwd) {
        return this.runGitCommand(['fetch'], cwd);
    },

    async pull(cwd) {
        return this.runGitCommand(['pull'], cwd);
    },

    async push(cwd) {
        return this.runGitCommand(['push'], cwd);
    }
};

