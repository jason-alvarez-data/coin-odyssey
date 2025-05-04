const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path for the template database
const templateDbPath = path.join(__dirname, '..', '..', 'template.db');

// Create and initialize the template database
function createTemplateDatabase() {
    // Remove existing template if it exists
    if (fs.existsSync(templateDbPath)) {
        fs.unlinkSync(templateDbPath);
    }

    // Create new template database
    const db = new Database(templateDbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create tables
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

    // Close the database connection
    db.close();

    console.log('Template database created successfully at:', templateDbPath);
}

// Run the initialization
createTemplateDatabase(); 