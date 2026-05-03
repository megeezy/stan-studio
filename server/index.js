/* global process */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import pty from 'node-pty';
import fs from 'fs';

const logFile = 'server_error.log';
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
};

process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION: ${err.stack}`);
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

io.on('connection', (socket) => {
    log('Client connected to terminal');

    try {
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: os.homedir(),
            env: process.env
        });

        ptyProcess.on('data', (data) => {
            socket.emit('output', data);
        });

        socket.on('input', (data) => {
            ptyProcess.write(data);
        });

        socket.on('resize', (size) => {
            ptyProcess.resize(size.cols, size.rows);
        });

        socket.on('disconnect', () => {
            log('Client disconnected from terminal');
            ptyProcess.kill();
        });
    } catch (err) {
        log(`PTY SPAWN ERROR: ${err.stack}`);
    }
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    log(`Terminal server running on port ${PORT}`);
});
