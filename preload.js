const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // File System Operations
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
    
    // Database Operations - Coins
    getAllCoins: () => ipcRenderer.invoke('get-all-coins'),
    getUniqueCountries: () => ipcRenderer.invoke('get-unique-countries'),
    addCoin: (coinData) => ipcRenderer.invoke('add-coin', coinData),
    updateCoin: (coinId, coinData) => ipcRenderer.invoke('update-coin', coinId, coinData),
    deleteCoin: (coinId) => ipcRenderer.invoke('delete-coin', coinId),
    getCoinById: (coinId) => ipcRenderer.invoke('get-coin-by-id', coinId),
    
    // Analytics Operations
    getValueTimeline: () => ipcRenderer.invoke('get-value-timeline'),
    getGeographicDistribution: () => ipcRenderer.invoke('get-geographic-distribution'),
    getYearDistribution: () => ipcRenderer.invoke('get-year-distribution'),
    getCollectionComposition: () => ipcRenderer.invoke('get-collection-composition'),
    
    // Settings and Theme
    getSetting: (key) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    
    // Map Operations
    updateMapData: (countryData) => ipcRenderer.invoke('update-map-data', countryData),
    
    // Search Operations
    searchCoins: (searchText, searchField) => ipcRenderer.invoke('search-coins', searchText, searchField),
    
    // Error Handling
    reportError: (error) => ipcRenderer.invoke('report-error', error),
    
    // Event Handling
    on: (channel, callback) => {
        const validChannels = ['theme-changed', 'collection-updated'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    }
});