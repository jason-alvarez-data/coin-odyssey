const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const electron = require('electron');
const { app } = require('@electron/remote');

// Get the proper app data path
const userDataPath = app.getPath('userData');

// Ensure our database directory exists
const dbDirectory = path.join(userDataPath, 'database');
if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
}

// Function to generate or retrieve encryption key
function getEncryptionKey() {
    const keyPath = path.join(userDataPath, '.key');
    try {
        // Try to read existing key
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8');
        } else {
            // Generate new key if none exists
            const key = crypto.randomBytes(32).toString('hex');
            // Save key with restricted permissions
            fs.writeFileSync(keyPath, key, { mode: 0o600 });
            return key;
        }
    } catch (error) {
        console.error('Error handling encryption key:', error);
        throw error;
    }
}

// Set up the database path in the user's app data
const dbPath = path.join(dbDirectory, 'coins.db');
console.log(`Using database at: ${dbPath}`);

// Create database instance
let db;
try {
    db = new Database(dbPath, {
        verbose: console.log,
    });

    // Enable encryption with ChaCha20-Poly1305 (default cipher)
    const encryptionKey = getEncryptionKey();
    
    // If this is a new database, encrypt it
    if (!fs.existsSync(dbPath)) {
        db.pragma(`rekey='${encryptionKey}'`);
    } else {
        // If database exists, try to unlock it
        db.pragma(`key='${encryptionKey}'`);
    }

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

} catch (error) {
    console.error('Failed to initialize encrypted database:', error);
    throw error;
}

// Test database connection
try {
    const testQuery = db.prepare('SELECT COUNT(*) as count FROM coins').get();
    console.log(`Database connection test: ${testQuery.count} coins found`);
} catch (error) {
    console.error('Database initialization error:', error);
    console.log('If this is the first run, tables will be created below');
}

// Create tables if they don't exist
function initDatabase() {
    try {
        // Wrap table creation in a transaction for atomicity
        db.transaction(() => {
            // Coins table
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
                    notes TEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Coin images table
            db.exec(`
                CREATE TABLE IF NOT EXISTS coin_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coin_id INTEGER,
                    image_path TEXT,
                    image_type TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
                )
            `);

            // Create trigger for updated_at timestamp
            db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_coins_timestamp 
                AFTER UPDATE ON coins
                BEGIN
                    UPDATE coins SET updated_at = CURRENT_TIMESTAMP 
                    WHERE id = NEW.id;
                END;
            `);
        })();

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Initialize database
initDatabase();

// Database operations
const dbOperations = {
    addCoin: function(coinData) {
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
            console.log(`Coin added with ID: ${result.lastInsertRowid}`);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding coin:', error);
            throw error;
        }
    },

    addCoinImage: function(imageData) {
        try {
            const stmt = db.prepare(`
                INSERT INTO coin_images (coin_id, image_path, image_type)
                VALUES (@coin_id, @image_path, @image_type)
            `);
            
            const result = stmt.run(imageData);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding coin image:', error);
            throw error;
        }
    },

    getAllCoins: function() {
        try {
            const stmt = db.prepare('SELECT * FROM coins');
            return stmt.all();
        } catch (error) {
            console.error('Error getting all coins:', error);
            return [];
        }
    },

    getCoinById: function(id) {
        try {
            const stmt = db.prepare('SELECT * FROM coins WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            console.error(`Error getting coin #${id}:`, error);
            return null;
        }
    },

    getCoinImages: function(coinId) {
        try {
            const stmt = db.prepare('SELECT * FROM coin_images WHERE coin_id = ?');
            return stmt.all(coinId);
        } catch (error) {
            console.error(`Error getting images for coin #${coinId}:`, error);
            return [];
        }
    },

    updateCoin: function(id, coinData) {
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
            console.error(`Error updating coin #${id}:`, error);
            throw error;
        }
    },

    deleteCoin: function(id) {
        try {
            const stmt = db.prepare('DELETE FROM coins WHERE id = ?');
            const result = stmt.run(id);
            return result.changes > 0;
        } catch (error) {
            console.error(`Error deleting coin #${id}:`, error);
            throw error;
        }
    },

    getCoinCount: function() {
        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM coins');
            const result = stmt.get();
            return result.count;
        } catch (error) {
            console.error('Error getting coin count:', error);
            return 0;
        }
    },

    getUniqueCountries: function() {
        try {
            const stmt = db.prepare('SELECT DISTINCT country FROM coins WHERE country IS NOT NULL');
            return stmt.all().map(row => row.country);
        } catch (error) {
            console.error('Error getting unique countries:', error);
            return [];
        }
    },

    close: function() {
        try {
            db.close();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database:', error);
        }
    }
};

// Add proper shutdown handlers
process.on('exit', () => {
    if (db) {
        try {
            db.close();
            console.log('Database connection closed properly');
        } catch (error) {
            console.error('Error while closing database:', error);
        }
    }
});

// Handle unexpected shutdowns
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
        if (db) {
            try {
                db.close();
                console.log(`Database connection closed on ${signal}`);
            } catch (error) {
                console.error(`Error while closing database on ${signal}:`, error);
            } finally {
                process.exit(0);
            }
        }
    });
});

module.exports = dbOperations;