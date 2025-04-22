const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
    require('electron-squirrel-startup') && app.quit();
} catch (e) {
    console.log('electron-squirrel-startup not found, skipping...');
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        show: false, // Don't show the window until it's ready
        minWidth: 800, // Add minimum window size for better UX
        minHeight: 600,
        icon: path.join(__dirname, 'src', 'assets', 'Coin Odyssey_favicon.png')
    });

    // Show window when ready and maximize it
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    // Set Content Security Policy for map tiles and external resources
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval';" +
                    "img-src 'self' data: https://*.tile.openstreetmap.org https://*.openstreetmap.org;" +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com;" +
                    "style-src 'self' 'unsafe-inline' https://unpkg.com;" +
                    "connect-src 'self' https://*.tile.openstreetmap.org https://*.openstreetmap.org"
                ]
            }
        });
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Open the DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Handle IPC events
ipcMain.on('app-error', (event, error) => {
    console.error('Application Error:', error);
});