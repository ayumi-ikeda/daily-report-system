import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import getPort from 'get-port';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

// Set DB_PATH to userData directory
process.env.DB_PATH = path.join(app.getPath('userData'), 'database.sqlite');
process.env.IS_ELECTRON = 'true';

async function createWindow() {
    const port = await getPort({ port: 3001 });

    // Start Express Server as a separate process
    // In production, we point to the unpacked asar or relative path
    const serverPath = path.join(__dirname, '../server/server.js');

    serverProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: port.toString(),
            NODE_ENV: app.isPackaged ? 'production' : 'development'
        },
        stdio: 'inherit'
    });

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Give the server a moment to start
        setTimeout(() => {
            mainWindow.loadURL(`http://localhost:${port}`);
        }, 500);
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('quit', () => {
    if (serverProcess) serverProcess.kill();
});
