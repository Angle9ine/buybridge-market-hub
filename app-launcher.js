#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Function to wait for server to be ready
function waitForServer(port = 3000, maxAttempts = 30) {
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const req = http.get(`http://localhost:${port}`, (res) => {
                clearInterval(interval);
                resolve(true);
            }).on('error', () => {
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve(false);
                }
            });
            req.end();
        }, 500);
    });
}

// Function to open browser using Windows built-in
function openBrowser(url) {
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';

    let command;
    if (isWindows) {
        command = `start "" "${url}"`;
        spawn('cmd.exe', ['/c', command]);
    } else if (isMac) {
        spawn('open', [url]);
    } else if (isLinux) {
        spawn('xdg-open', [url]);
    }
}

async function startApp() {
    console.log('🚀 Starting BuyBridge Market Hub...');
    
    // Start the server
    const server = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    // Wait for server to be ready
    console.log('⏳ Waiting for server to start...');
    const isReady = await waitForServer();

    if (isReady) {
        console.log('✅ Server is ready!');
        console.log('🌐 Opening app in browser...');
        setTimeout(() => {
            openBrowser('http://localhost:3000');
        }, 1000);
    } else {
        console.error('❌ Server failed to start');
        process.exit(1);
    }

    // Keep the process alive
    server.on('exit', (code) => {
        console.log(`Server exited with code ${code}`);
        process.exit(code);
    });
}

startApp().catch(err => {
    console.error('Error starting app:', err);
    process.exit(1);
});
