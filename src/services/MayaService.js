import { FileSystem } from "./FileSystem";

const MAYA_SYSTEM_INSTRUCTION = `You are Maya, an elite AI coding agent integrated into Stan Studio.
Your goal is to provide high-precision code generation and workspace manipulation.
You run locally via Ollama.

ACTION RULES:
To perform an action, you MUST output a JSON block wrapped in <maya_action> tags.
Example:
<maya_action>
{
  "name": "create_file",
  "args": { "name": "index.html", "content": "<html>...</html>" }
}
</maya_action>

AVAILABLE TOOLS:
1. create_file(name, content): Create a new file.
2. edit_file(path, content): Overwrite an existing file.
3. delete_item(path): Delete a file or folder.
4. create_folder(name): Create a new directory.
5. run_command(command): Run a terminal command.
6. read_file(path): Read file content.
7. list_files(path?): List directory contents.

Always execute the necessary tools to fulfill the user's request. Do not just talk.`;

class MayaService {
    constructor() {
        this.modelName = localStorage.getItem('MAYA_MODEL') || "qwen2.5-coder:3b";
        this.chatHistory = [];
        this.context = {
            folderHandle: null,
            activeFile: null,
            terminalCallback: null
        };
    }

    setModel(name) {
        this.modelName = name;
        localStorage.setItem('MAYA_MODEL', name);
    }

    setContext(context) {
        this.context = { ...this.context, ...context };
    }

    async sendMessage(message, onToolCall) {
        this.chatHistory.push({ role: 'user', content: message });

        try {
            const { invoke } = await import('@tauri-apps/api/core');

            const payload = JSON.stringify({
                model: this.modelName,
                messages: [
                    { role: 'system', content: MAYA_SYSTEM_INSTRUCTION },
                    ...this.chatHistory
                ],
                stream: false,
                options: {
                    temperature: 0.1 // Lower temperature for higher precision
                }
            });

            // Native bridge to Ollama
            const responseText = await invoke('maya_native_request', { payload });
            const data = JSON.parse(responseText);

            if (data.error) throw new Error(data.error);

            let reply = data.message.content;

            // Parse and execute actions
            const actionRegex = /<maya_action>([\s\S]*?)<\/maya_action>/g;
            let match;
            const results = [];

            while ((match = actionRegex.exec(reply)) !== null) {
                try {
                    const action = JSON.parse(match[1].trim());
                    if (onToolCall) onToolCall(action.name, action.args);
                    const result = await this.handleToolCall(action.name, action.args);
                    results.push(`Action ${action.name} result: ${result}`);
                } catch (e) {
                    results.push(`Action error: ${e.message}`);
                }
            }

            // If actions were performed, we might want to tell the AI the results, 
            // but for a smooth UI we'll just return the text and maybe a summary of actions
            this.chatHistory.push({ role: 'assistant', content: reply });

            if (results.length > 0) {
                return reply + "\n\n" + results.join("\n");
            }

            return reply;
        } catch (err) {
            console.error("[MayaService] Connection failed:", err);
            throw new Error(err.message || "Native engine connection failed.");
        }
    }

    clearHistory() {
        this.chatHistory = [];
    }

    async handleToolCall(name, args) {
        console.log(`[Maya Tool] ${name}:`, args);
        try {
            switch (name) {
                case "create_file": {
                    if (!this.context.folderHandle) throw new Error("No folder open");
                    await FileSystem.createFile(this.context.folderHandle, args.name);
                    const path = args.name.startsWith('/') ? args.name : `${this.context.folderHandle.path}/${args.name}`;
                    const fileObj = {
                        type: this.context.folderHandle.type,
                        path: path,
                        name: args.name.split('/').pop(),
                        kind: 'file'
                    };
                    await FileSystem.writeFile(fileObj, args.content);
                    return `Successfully created ${args.name}`;
                }
                case "edit_file": {
                    const path = args.path.startsWith('/') ? args.path : `${this.context.folderHandle?.path}/${args.path}`;
                    const fileObj = {
                        type: this.context.folderHandle?.type || 'native',
                        path: path,
                        name: path.split('/').pop(),
                        kind: 'file'
                    };
                    await FileSystem.writeFile(fileObj, args.content);
                    return `Updated ${args.path}`;
                }
                case "delete_item": {
                    const path = args.path.startsWith('/') ? args.path : `${this.context.folderHandle?.path}/${args.path}`;
                    await FileSystem.removeFile({
                        type: this.context.folderHandle?.type || 'native',
                        path: path
                    });
                    return `Deleted ${args.path}`;
                }
                case "run_command": {
                    if (this.context.terminalCallback) {
                        this.context.terminalCallback(args.command);
                        return `Started: ${args.command}`;
                    }
                    return "Terminal unavailable";
                }
                case "read_file": {
                    const path = args.path.startsWith('/') ? args.path : `${this.context.folderHandle?.path}/${args.path}`;
                    return await FileSystem.readFile({
                        type: this.context.folderHandle?.type || 'native',
                        path: path,
                        name: path.split('/').pop(),
                        kind: 'file'
                    });
                }
                case "list_files": {
                    if (!this.context.folderHandle) throw new Error("No folder open");
                    const path = args.path || this.context.folderHandle.path;
                    const tree = await FileSystem.scanDirectory({ ...this.context.folderHandle, path });
                    return JSON.stringify(tree.map(i => ({ name: i.name, kind: i.kind, path: i.path })));
                }
                default:
                    return "Unknown tool";
            }
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }
}

export const Maya = new MayaService();
