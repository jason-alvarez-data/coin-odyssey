const { app, BrowserWindow } = require('electron');
const path = require('path');
require('@electron/remote/main').initialize();

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Enable remote module for this window
    require('@electron/remote/main').enable(win.webContents);

    // Load the app's HTML file
    win.loadFile('index.html');

    // Uncomment the following line if you want to open DevTools by default
    // win.webContents.openDevTools();
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS, create a new window when clicking the dock icon if no windows exist
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});