const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const db = require('./src/database/db.js');
const Papa = require('papaparse');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Initialize electron-store
const store = new Store();

let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
    require('electron-squirrel-startup') && app.quit();
} catch (e) {
    console.log('electron-squirrel-startup not found, skipping...');
}

// Configure auto updater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        show: false,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'src', 'assets', 'Coin Odyssey_favicon_16x16.png')
    });

    // Set CSP headers
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: blob: file:; " +
                    "media-src 'self' blob:;"
                ]
            }
        });
    });

    // Show window when ready and maximize it
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.loadFile('index.html');

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// App lifecycle handlers
app.whenReady().then(() => {
    createWindow();
    
    // Apply saved theme on startup
    const savedTheme = store.get('app-theme');
    if (savedTheme) {
        mainWindow.webContents.send('theme-changed', savedTheme);
    }
    
    // Check for updates after app starts
    setTimeout(() => {
        checkForUpdates();
    }, 3000);
});

// Function to check for updates
function checkForUpdates() {
    autoUpdater.checkForUpdates().catch(err => {
        console.error('Error checking for updates:', err);
    });
}

// Auto updater events
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    // Notify the user that an update is available
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);
    }
});

// Handle IPC for updates
ipcMain.handle('start-update-download', async () => {
    autoUpdater.downloadUpdate().catch(err => {
        console.error('Error downloading update:', err);
        return { success: false, error: err.message };
    });
    return { success: true };
});

ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall();
    return { success: true };
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Error Handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// File System Operation Handlers
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const fullPath = path.join(__dirname, filePath);
        return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
});

// Database Operation Handlers
ipcMain.handle('get-all-coins', async () => {
    try {
        return await db.getAllCoins();
    } catch (error) {
        console.error('Error getting all coins:', error);
        throw error;
    }
});

ipcMain.handle('get-unique-countries', async () => {
    try {
        return await db.getUniqueCountries();
    } catch (error) {
        console.error('Error getting unique countries:', error);
        throw error;
    }
});

ipcMain.handle('add-coin', async (event, coinData) => {
    try {
        return await db.addCoin(coinData);
    } catch (error) {
        console.error('Error adding coin:', error);
        throw error;
    }
});

ipcMain.handle('update-coin', async (event, coinId, coinData) => {
    try {
        return await db.updateCoin(coinId, coinData);
    } catch (error) {
        console.error('Error updating coin:', error);
        throw error;
    }
});

ipcMain.handle('delete-coin', async (event, coinId) => {
    try {
        return await db.deleteCoin(coinId);
    } catch (error) {
        console.error('Error deleting coin:', error);
        throw error;
    }
});

// Map Operation Handlers
ipcMain.handle('update-map-data', async (event, countryData) => {
    try {
        // Just pass back the data since we don't need to store it
        return countryData;
    } catch (error) {
        console.error('Error updating map data:', error);
        throw error;
    }
});

// Search Operations Handler
ipcMain.handle('search-coins', async (event, searchText, searchField) => {
    try {
        return await db.searchCoins(searchText, searchField);
    } catch (error) {
        console.error('Error searching coins:', error);
        throw error;
    }
});

// Import/Export Operations
ipcMain.handle('import-collection', async (event, fileData) => {
    // NOTE: fileData is now expected to be a JSON string of PRE-MAPPED coin objects
    try {
        console.log('Received mapped data string for import. Length:', fileData?.length);
        let coinsData;

        // 1. Parse the incoming JSON string
        try {
            coinsData = JSON.parse(fileData);
            console.log(`Parsed mapped JSON: ${Array.isArray(coinsData) ? coinsData.length : 'Invalid format'} items.`);
        } catch (jsonError) {
            console.error('JSON Parsing failed for mapped data:', jsonError);
            throw new Error('Invalid data format received after mapping.');
        }

        // 2. Validate data structure and content
        if (!Array.isArray(coinsData)) {
            throw new Error('Invalid data format. Expected an array of coin objects.');
        }

        const validationErrors = [];
        const requiredDbFields = DB_COLUMNS.filter(c => c.required).map(c => c.value);

        for (let i = 0; i < coinsData.length; i++) {
            const coin = coinsData[i];
            if (typeof coin !== 'object' || coin === null) {
                validationErrors.push(`Record ${i + 1}: Invalid data format (not an object).`);
                continue; 
            }

            for (const field of requiredDbFields) {
                // Check if the required field exists and is not null/empty string
                if (coin[field] === null || coin[field] === '' || coin[field] === undefined) {
                    validationErrors.push(`Record ${i + 1}: Missing or empty required field '${field}'.`);
                }
            }
            // Add more specific validation (e.g., year is a number) if necessary
        }

        if (validationErrors.length > 0) {
            console.error('Import validation failed after mapping:', validationErrors);
            // Consider sending back only the first few errors for brevity
            const errorMsg = `Validation Failed: ${validationErrors.slice(0, 5).join('; ')}${validationErrors.length > 5 ? ' (and more...)' : ''}`;
            throw new Error(errorMsg);
        }

        // 3. Insert into Database
        console.log('Validation successful. Proceeding with database insertion...');
        // Use a bulk insert function in db.js if possible!
        // Example: await db.addMultipleCoins(coinsData);
        // Fallback to individual inserts:
        for (const coin of coinsData) {
            // Ensure data types are correct if necessary before insert (e.g., numbers)
            // Example: coin.year = parseInt(coin.year, 10) || null;
            // Example: coin.value = parseFloat(coin.value) || 0;
            await db.addCoin(coin); 
        }

        console.log(`Successfully imported ${coinsData.length} coins.`);
        return { success: true, count: coinsData.length };

    } catch (error) {
        console.error('Error during import-collection handling (main process):', error);
        // Return error message to renderer
        return { success: false, error: error.message }; 
    }
});

ipcMain.handle('export-collection', async (event, format) => {
    try {
        const coins = await db.getAllCoins();
        
        if (format === 'json') {
            return JSON.stringify(coins, null, 2);
        } else if (format === 'csv') {
            return Papa.unparse(coins);
        } else {
            throw new Error(`Unsupported export format: ${format}`);
        }
    } catch (error) {
        console.error('Error exporting collection:', error);
        throw error;
    }
});

// Analytics Handlers
ipcMain.handle('get-value-timeline', async () => {
    try {
        return await db.getValueTimeline();
    } catch (error) {
        console.error('Error getting value timeline:', error);
        throw error;
    }
});

ipcMain.handle('get-geographic-distribution', async () => {
    try {
        return await db.getGeographicDistribution();
    } catch (error) {
        console.error('Error getting geographic distribution:', error);
        throw error;
    }
});

ipcMain.handle('get-year-distribution', async () => {
    try {
        return await db.getYearDistribution();
    } catch (error) {
        console.error('Error getting year distribution:', error);
        throw error;
    }
});

ipcMain.handle('get-collection-composition', async () => {
    try {
        return await db.getCollectionComposition();
    } catch (error) {
        console.error('Error getting collection composition:', error);
        throw error;
    }
});

// Settings Handler
ipcMain.handle('get-setting', async (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-setting', async (event, key, value) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('set-theme', async (event, theme) => {
    store.set('app-theme', theme);
    event.sender.send('theme-changed', theme);
    return true;
});

// Error Reporting Handler
ipcMain.handle('report-error', async (event, error) => {
    console.error('Renderer Error:', error);
    return true;
});

// Add this with the other ipcMain handlers
ipcMain.handle('get-coin-by-id', async (event, coinId) => {
    try {
        return await db.getCoinById(coinId);
    } catch (error) {
        console.error('Error getting coin by ID:', error);
        throw error;
    }
});