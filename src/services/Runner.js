// Runner.js - Native Command Execution Service
import { Command } from '@tauri-apps/plugin-shell';
import { getRunnerConfig } from '../utils/LanguageRegistry';

export const Runner = {
    // Execute a file based on its extension
    async runFile(fileData, onOutput, onExit) {
        if (!fileData || !fileData.path) {
            throw new Error("No file path available to run.");
        }

        const config = getRunnerConfig(fileData.name);

        if (!config) {
            throw new Error(`Running not supported for .${fileData.name.split('.').pop()} files.`);
        }

        try {
            const args = typeof config.args === 'function' ? config.args(fileData.path) : config.args;

            console.log(`[Runner] Executing: ${config.command} ${args.join(' ')}`);

            const cmd = Command.create(config.command, args);

            cmd.on('close', data => {
                console.log(`[Runner] Process exited with code ${data.code}`);
                if (onExit) onExit(data.code);
            });

            cmd.on('error', error => {
                console.error(`[Runner] Process error: ${error}`);
                if (onOutput) onOutput(`\x1b[31mError: ${error}\x1b[0m\r\n`);
            });

            cmd.stdout.on('data', line => {
                if (onOutput) onOutput(line + '\r\n');
            });

            cmd.stderr.on('data', line => {
                if (onOutput) onOutput(`\x1b[31m${line}\x1b[0m\r\n`);
            });

            const child = await cmd.spawn();
            return child;
        } catch (err) {
            console.error("[Runner] Failed to spawn process:", err);
            throw err;
        }
    }
};
