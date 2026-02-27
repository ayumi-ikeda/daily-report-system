import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import getPort from 'get-port';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

// Disable hardware acceleration to fix contenteditable cursor bugs (React-Quill)
app.disableHardwareAcceleration();

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

ipcMain.handle('save-pdf', async (event) => {
    if (!mainWindow) return { success: false, error: 'メイン画面が見つかりません' };

    // 日付フォーマット YYYY-MM-DD
    const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
    const defaultPath = `日報_${dateStr}.pdf`;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'PDFとして保存',
        defaultPath: defaultPath,
        filters: [{ name: 'PDFファイル', extensions: ['pdf'] }]
    });

    if (filePath) {
        try {
            const pdfData = await mainWindow.webContents.printToPDF({
                printBackground: true,
                pageSize: 'A4',
            });
            fs.writeFileSync(filePath, pdfData);
            return { success: true, filePath };
        } catch (error) {
            console.error('PDF生成に失敗しました:', error);
            return { success: false, error: error.message };
        }
    }
    return { success: false, canceled: true };
});

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
