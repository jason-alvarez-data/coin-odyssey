const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const log = require('electron-log');

// Get the correct path for the database file
const getDbPath = () => {
    try {
        const app = electron.app || (electron.remote && electron.remote.app);
        log.info(`[getDbPath] Is packaged: ${app?.isPackaged}`);
        
        if (app && app.isPackaged) {
            const userDataPath = app.getPath('userData');
            if (!userDataPath) {
                 log.error('[getDbPath] Failed to get userData path.');
                 throw new Error('Could not determine userData path.');
            }
            const dbPath = path.join(userDataPath, 'coins.db');
            log.info(`[getDbPath] Production DB path: ${dbPath}`);
            return dbPath;
        } else {
            const dbPath = path.join(process.cwd(), 'coins.db');
            log.info(`[getDbPath] Development DB path: ${dbPath}`);
            return dbPath;
        }
    } catch (error) {
        log.error(`[getDbPath] Error: ${error.message}`, error.stack);
        throw error;
    }
};

// Get the template database path
const getTemplateDbPath = () => {
    try {
        const app = electron.app || (electron.remote && electron.remote.app);
        log.info(`[getTemplateDbPath] Is packaged: ${app?.isPackaged}`);
        
        if (app && app.isPackaged) {
            const resourcePath = process.resourcesPath;
             if (!resourcePath) {
                 log.error('[getTemplateDbPath] Failed to get resourcesPath.');
                 throw new Error('Could not determine resources path.');
            }
            const templatePath = path.join(resourcePath, 'template.db');
            log.info(`[getTemplateDbPath] Production template path: ${templatePath}`);
            return templatePath;
        } else {
            const templatePath = path.join(process.cwd(), 'template.db');
            log.info(`[getTemplateDbPath] Development template path: ${templatePath}`);
            return templatePath;
        }
     } catch (error) {
        log.error(`[getTemplateDbPath] Error: ${error.message}`, error.stack);
        throw error;
    }
};

// Make sure the database directory exists and copy template if needed
const initializeDatabase = (targetDbPath) => {
    log.info(`[initializeDatabase] Initializing for target: ${targetDbPath}`);
    try {
        const dbDir = path.dirname(targetDbPath);
        log.info(`[initializeDatabase] Database directory: ${dbDir}`);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dbDir)) {
            log.info(`[initializeDatabase] Creating database directory: ${dbDir}`);
            try {
                fs.mkdirSync(dbDir, { recursive: true });
                log.info(`[initializeDatabase] Directory created successfully.`);
            } catch (mkdirError) {
                 log.error(`[initializeDatabase] FAILED to create directory ${dbDir}: ${mkdirError.message}`, mkdirError.stack);
                 throw new Error(`Failed to create database directory: ${mkdirError.message}`);
            }
        } else {
             log.info(`[initializeDatabase] Directory already exists: ${dbDir}`);
        }
        
        // If database doesn't exist, copy from template
        if (!fs.existsSync(targetDbPath)) {
            log.info(`[initializeDatabase] Database does not exist at ${targetDbPath}, attempting to initialize...`);
            const templatePath = getTemplateDbPath();
            log.info(`[initializeDatabase] Source template path: ${templatePath}`);
            
            if (fs.existsSync(templatePath)) {
                log.info(`[initializeDatabase] Template exists at ${templatePath}, attempting copy...`);
                 try {
                    fs.copyFileSync(templatePath, targetDbPath);
                    log.info(`[initializeDatabase] Successfully copied template from ${templatePath} to ${targetDbPath}`);
                 } catch (copyError) {
                     log.error(`[initializeDatabase] FAILED to copy template from ${templatePath} to ${targetDbPath}: ${copyError.message}`, copyError.stack);
                     throw new Error(`Failed to copy template database: ${copyError.message}`);
                 }
            } else {
                log.warn(`[initializeDatabase] Template database NOT FOUND at: ${templatePath}`);
                // Decide: either throw an error or try creating an empty DB later
                 throw new Error(`Template database not found at ${templatePath}. Cannot initialize.`);
                // console.log('[initializeDatabase] Will attempt to create a new empty database'); 
            }
        } else {
            log.info(`[initializeDatabase] Database file already exists at: ${targetDbPath}`);
        }
    } catch (error) {
        log.error(`[initializeDatabase] Error during initialization: ${error.message}`, error.stack);
        throw error; // Re-throw to be caught by the main startup sequence
    }
};

// --- Database Initialization Sequence ---
let db;
let dbPath;

try {
    log.info('--- Starting Database Setup ---');
    dbPath = getDbPath();
    log.info(`Using database path: ${dbPath}`);
    
    initializeDatabase(dbPath); // Ensure directory and template are handled first

    log.info('Attempting to create database connection...');
    // Normalize the path to handle potential issues
    const normalizedPath = path.normalize(dbPath);
    log.info(`Normalized database path for connection: ${normalizedPath}`);
    
    // Try connecting with verbose logging from better-sqlite3
    db = new Database(normalizedPath, { verbose: (message) => log.info(`[better-sqlite3] ${message}`) });
    
    log.info('--- Database Connection Successful ---');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    log.info('Foreign keys enabled.');

    // Test database connection (optional, but good for confirmation)
    try {
        const testQuery = db.prepare('SELECT COUNT(*) as count FROM coins').get();
        log.info(`Database connection test successful: ${testQuery.count} coins found (or table exists).`);
    } catch (testError) {
        log.warn(`Database connection test failed (might be first run): ${testError.message}`);
        // Don't throw, as initDatabase below will create tables
    }

} catch (error) {
    log.error('--- DATABASE SETUP FAILED ---');
    log.error(`Error during database connection/initialization for path "${dbPath}": ${error.message}`, error.stack);
    
    // Propagate the error to be caught by the main process uncaught exception handler
    // This will trigger the dialog box or renderer error message
    throw error; 
}

// --- Rest of your db.js (initDatabase function, dbOperations, module.exports) ---
// Ensure the initDatabase function uses the global 'db' variable defined above
// Ensure dbOperations methods also use the global 'db' variable

function initDatabase() {
    if (!db) {
        log.error("[initDatabase] Cannot initialize tables, DB connection is not available.");
        return;
    }
    try {
        log.info("[initDatabase] Ensuring tables exist...");
        db.exec(`
            CREATE TABLE IF NOT EXISTS coins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                year INTEGER DEFAULT NULL,
                country TEXT DEFAULT NULL,
                value REAL DEFAULT NULL,
                unit TEXT DEFAULT NULL,
                mint TEXT DEFAULT NULL,
                mint_mark TEXT DEFAULT NULL,
                type TEXT DEFAULT NULL,
                format TEXT DEFAULT NULL,
                series TEXT DEFAULT NULL,
                region TEXT DEFAULT NULL,
                storage TEXT DEFAULT NULL,
                status TEXT DEFAULT NULL,
                quantity INTEGER DEFAULT NULL,
                purchase_date TEXT DEFAULT NULL,
                purchase_price REAL DEFAULT NULL,
                current_value REAL DEFAULT NULL,
                notes TEXT DEFAULT NULL
            )
        `);
        db.exec(`
            CREATE TABLE IF NOT EXISTS coin_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coin_id INTEGER,
                image_path TEXT,
                image_type TEXT,
                FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
            )
        `);
        log.info('[initDatabase] Table initialization check complete.');
    } catch (error) {
        log.error(`[initDatabase] Error initializing tables: ${error.message}`, error.stack);
        throw error; // Or handle differently if needed
    }
}

// Initialize database tables on module load
initDatabase();

// Database operations object (ensure it uses the global 'db')
const dbOperations = {
    // ... your existing CRUD, Analytics, Search methods ...
    // Make sure all methods reference the 'db' variable from the outer scope, e.g.:
    getAllCoins: function() {
        if (!db) { log.error("getAllCoins: DB not connected"); return []; }
        try {
            const stmt = db.prepare('SELECT * FROM coins');
            return stmt.all();
        } catch (error) {
            log.error('Error getting all coins:', error);
            return [];
        }
    },
    addCoin: function(coinData) {
        if (!db) { log.error("addCoin: DB not connected"); throw new Error('Database not connected'); }
        try {
            // Ensure all fields exist with default values
            const defaultCoinData = {
                title: null,
                year: null,
                country: null,
                value: null,
                unit: null,
                mint: null,
                mint_mark: null,
                type: null,
                format: null,
                series: null,
                region: null,
                storage: null,
                status: null,
                quantity: null,
                purchase_date: null,
                purchase_price: null,
                current_value: null,
                notes: null
            };

            // Merge provided data with defaults
            const completeData = { ...defaultCoinData, ...coinData };

            // Convert empty strings to null
            Object.keys(completeData).forEach(key => {
                if (completeData[key] === '') {
                    completeData[key] = null;
                }
            });

            // Convert string numbers to their proper types
            if (completeData.year) completeData.year = Number(completeData.year);
            if (completeData.value) completeData.value = Number(completeData.value);
            if (completeData.quantity) completeData.quantity = Number(completeData.quantity);
            if (completeData.purchase_price) completeData.purchase_price = Number(completeData.purchase_price);
            if (completeData.current_value) completeData.current_value = Number(completeData.current_value);

            const stmt = db.prepare(`
                INSERT INTO coins (
                    title, year, country, value, unit, mint, mint_mark, 
                    type, format, series, region, storage, status, quantity,
                    purchase_date, purchase_price, current_value, notes
                ) VALUES (
                    @title, @year, @country, @value, @unit, @mint, @mint_mark,
                    @type, @format, @series, @region, @storage, @status, @quantity,
                    @purchase_date, @purchase_price, @current_value, @notes
                )
            `);

            const result = stmt.run(completeData);
            log.info(`Coin added with ID: ${result.lastInsertRowid}`);
            return result.lastInsertRowid;
        } catch (error) {
            log.error('Error adding coin:', error);
            throw error;
        }
    },
    addCoinImage: function(imageData) {
        if (!db) { log.error("addCoinImage: DB not connected"); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare(`
                INSERT INTO coin_images (coin_id, image_path, image_type)
                VALUES (@coin_id, @image_path, @image_type)
            `);

            const result = stmt.run(imageData);
            return result.lastInsertRowid;
        } catch (error) {
            log.error('Error adding coin image:', error);
            throw error;
        }
    },
    getCoinById: function(id) {
        if (!db) { log.error(`getCoinById(${id}): DB not connected`); return null; }
        try {
            const stmt = db.prepare('SELECT * FROM coins WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            log.error(`Error getting coin by ID (${id}):`, error);
            throw error;
        }
    },
    getCoinImages: function(coinId) {
         if (!db) { log.error(`getCoinImages(${coinId}): DB not connected`); return []; }
        try {
            const stmt = db.prepare('SELECT * FROM coin_images WHERE coin_id = ?');
            return stmt.all(coinId);
        } catch (error) {
            log.error(`Error getting images for coin #${coinId}:`, error);
            return [];
        }
    },
    updateCoin: function(id, coinData) {
         if (!db) { log.error(`updateCoin(${id}): DB not connected`); throw new Error('Database not connected'); }
        try {
            // Build SET clause dynamically based on provided data
            const fields = Object.keys(coinData)
                .map(key => `${key} = @${key}`)
                .join(', ');

            const stmt = db.prepare(`UPDATE coins SET ${fields} WHERE id = @id`);

            // Add id to the data
            const dataWithId = { ...coinData, id };

            const result = stmt.run(dataWithId);
            return result.changes > 0;
        } catch (error) {
            log.error(`Error updating coin #${id}:`, error);
            throw error;
        }
    },
    deleteCoin: function(id) {
         if (!db) { log.error(`deleteCoin(${id}): DB not connected`); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare('DELETE FROM coins WHERE id = ?');
            const result = stmt.run(id);
            return result.changes > 0;
        } catch (error) {
            log.error(`Error deleting coin #${id}:`, error);
            throw error;
        }
    },
    getCoinCount: function() {
         if (!db) { log.error("getCoinCount: DB not connected"); return 0; }
        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM coins');
            const result = stmt.get();
            return result.count;
        } catch (error) {
            log.error('Error getting coin count:', error);
            return 0;
        }
    },
    getUniqueCountries: function() {
         if (!db) { log.error("getUniqueCountries: DB not connected"); return []; }
        try {
            const stmt = db.prepare('SELECT DISTINCT country FROM coins WHERE country IS NOT NULL');
            return stmt.all().map(row => row.country);
        } catch (error) {
            log.error('Error getting unique countries:', error);
            return [];
        }
    },
    getValueTimeline: function() {
         if (!db) { log.error("getValueTimeline: DB not connected"); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare(`
                SELECT 
                    purchase_date,
                    SUM(COALESCE(current_value, purchase_price, value, 0)) as total_value
                FROM coins 
                WHERE purchase_date IS NOT NULL
                GROUP BY purchase_date
                ORDER BY purchase_date ASC
            `);
            return stmt.all();
        } catch (error) {
            log.error('Error getting value timeline:', error);
            throw error;
        }
    },
    getGeographicDistribution: function() {
         if (!db) { log.error("getGeographicDistribution: DB not connected"); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare(`
                SELECT 
                    country,
                    COUNT(*) as coin_count,
                    SUM(COALESCE(current_value, purchase_price, value, 0)) as total_value
                FROM coins 
                WHERE country IS NOT NULL
                GROUP BY country
                ORDER BY coin_count DESC
            `);
            return stmt.all();
        } catch (error) {
            log.error('Error getting geographic distribution:', error);
            throw error;
        }
    },
    getYearDistribution: function() {
         if (!db) { log.error("getYearDistribution: DB not connected"); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare(`
                SELECT 
                    year,
                    COUNT(*) as coin_count
                FROM coins 
                WHERE year IS NOT NULL
                GROUP BY year
                ORDER BY year ASC
            `);
            return stmt.all();
        } catch (error) {
            log.error('Error getting year distribution:', error);
            throw error;
        }
    },
    getCollectionComposition: function() {
         if (!db) { log.error("getCollectionComposition: DB not connected"); throw new Error('Database not connected'); }
        try {
            const stmt = db.prepare(`
                SELECT 
                    type,
                    COUNT(*) as count,
                    SUM(COALESCE(current_value, purchase_price, value, 0)) as total_value
                FROM coins 
                WHERE type IS NOT NULL
                GROUP BY type
                ORDER BY count DESC
            `);
            return stmt.all();
        } catch (error) {
            log.error('Error getting collection composition:', error);
            throw error;
        }
    },
    searchCoins: function(searchText, searchField) {
         if (!db) { log.error("searchCoins: DB not connected"); return []; }
        try {
            let query = 'SELECT * FROM coins WHERE ';
            const params = {};
            
            if (searchField === 'all' || !searchField) {
                // Search in multiple columns
                query += `
                    (title LIKE @search OR
                    year LIKE @search OR
                    country LIKE @search OR
                    mint LIKE @search OR
                    mint_mark LIKE @search OR
                    type LIKE @search OR
                    series LIKE @search OR
                    status LIKE @search OR
                    notes LIKE @search)
                `;
                params.search = `%${searchText}%`;
            } else {
                // Search in specific column
                query += `${searchField} LIKE @search`;
                params.search = `%${searchText}%`;
            }
            
            const stmt = db.prepare(query);
            return stmt.all(params);
        } catch (error) {
            log.error('Error searching coins:', error);
            return [];
        }
    },
    filterCoins: function(filters) {
         if (!db) { log.error("filterCoins: DB not connected"); throw new Error('Database not connected'); }
        try {
            let query = 'SELECT * FROM coins WHERE 1=1';
            const params = [];

            // Build query dynamically based on filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    query += ` AND ${key} = ?`;
                    params.push(value);
                }
            });

            const stmt = db.prepare(query);
            return stmt.all(...params);
        } catch (error) {
            log.error('Error filtering coins:', error);
            throw error;
        }
    },
    importCoins: function(coins) {
         if (!db) { log.error("importCoins: DB not connected"); throw new Error('Database not connected'); }
        try {
            const insertStmt = db.prepare(`
                INSERT INTO coins (
                    title, year, country, value, unit, mint, mint_mark,
                    type, format, series, region, storage, status, quantity,
                    purchase_date, purchase_price, current_value, notes
                ) VALUES (
                    @title, @year, @country, @value, @unit, @mint, @mint_mark,
                    @type, @format, @series, @region, @storage, @status, @quantity,
                    @purchase_date, @purchase_price, @current_value, @notes
                )
            `);

            const importTransaction = db.transaction((coinsData) => {
                coinsData.forEach(coin => {
                    // Convert empty strings to null and numbers to proper type
                    const processedCoin = Object.entries(coin).reduce((acc, [key, value]) => {
                        if (value === '') {
                            acc[key] = null;
                        } else if (['year', 'value', 'quantity', 'purchase_price', 'current_value'].includes(key)) {
                            acc[key] = value ? Number(value) : null;
                        } else {
                            acc[key] = value;
                        }
                        return acc;
                    }, {});

                    insertStmt.run(processedCoin);
                });
            });

            importTransaction(coins);
            return true;
        } catch (error) {
            log.error('Error importing coins:', error);
            throw error;
        }
    },
    // Add the close method referenced in main.js
    close: function() {
        if (db) {
            try {
                db.close();
                log.info('Database connection closed successfully.');
                db = null; // Ensure db is nullified after closing
            } catch (error) {
                log.error('Error closing database connection:', error);
            }
        } else {
            log.warn('Attempted to close database, but connection was already closed or not established.');
        }
    }
};

module.exports = dbOperations; // Export the operations object