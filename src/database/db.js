const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Make sure the database path is consistent
const dbPath = path.join(process.cwd(), 'coins.db');
console.log(`Using database at: ${dbPath}`);

// Create database instance
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test database connection
try {
    const testQuery = db.prepare('SELECT COUNT(*) as count FROM coins').get();
    console.log(`Database connection test: ${testQuery.count} coins found`);
} catch (error) {
    console.error('Database initialization error:', error);
    // Don't throw the error, just log it as this might be first run
    console.log('If this is the first run, tables will be created below');
}

// Create tables if they don't exist
function initDatabase() {
    try {
        // Coins table - only creates if it doesn't exist
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

        // Coin images table - only creates if it doesn't exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS coin_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coin_id INTEGER,
                image_path TEXT,
                image_type TEXT,
                FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
            )
        `);

        console.log('Database initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Initialize database on module load
initDatabase();

// Database operations
const dbOperations = {
    // Replace the existing addCoin function with this one
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

  // Add an image for a coin
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

  // Get all coins
  getAllCoins: function() {
    try {
      const stmt = db.prepare('SELECT * FROM coins');
      return stmt.all();
    } catch (error) {
      console.error('Error getting all coins:', error);
      return [];
    }
  },

  // Get coin by ID
  getCoinById: function(id) {
    try {
      const stmt = db.prepare('SELECT * FROM coins WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error(`Error getting coin #${id}:`, error);
      return null;
    }
  },

  // Get images for a coin
  getCoinImages: function(coinId) {
    try {
      const stmt = db.prepare('SELECT * FROM coin_images WHERE coin_id = ?');
      return stmt.all(coinId);
    } catch (error) {
      console.error(`Error getting images for coin #${coinId}:`, error);
      return [];
    }
  },

  // Update coin
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

  // Delete coin
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

  // Get coin count
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

  // Get unique countries
  getUniqueCountries: function() {
    try {
      const stmt = db.prepare('SELECT DISTINCT country FROM coins WHERE country IS NOT NULL');
      return stmt.all().map(row => row.country);
    } catch (error) {
      console.error('Error getting unique countries:', error);
      return [];
    }
  },

  // Close database (for cleanup)
  close: function() {
    try {
      db.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
};

module.exports = dbOperations;