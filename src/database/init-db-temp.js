const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get the correct path for the template database
function getTemplatePath() {
    return path.join(process.cwd(), 'template.db');
}

// Create and initialize the template database
function createTemplateDatabase() {
    try {
        const templateDbPath = getTemplatePath();
        console.log('Node version:', process.version);
        console.log('Platform:', process.platform);
        console.log('Creating template database at:', templateDbPath);
        
        // Ensure the directory exists
        const dbDir = path.dirname(templateDbPath);
        if (!fs.existsSync(dbDir)) {
            console.log('Creating directory:', dbDir);
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Remove existing template if it exists
        if (fs.existsSync(templateDbPath)) {
            console.log('Removing existing template database');
            fs.unlinkSync(templateDbPath);
        }

        // Create new template database
        console.log('Initializing new database...');
        const db = new Database(templateDbPath, { verbose: console.log });

        // Enable foreign keys
        console.log('Enabling foreign keys...');
        db.pragma('foreign_keys = ON');

        // Create tables
        console.log('Creating coins table...');
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

        console.log('Creating coin_images table...');
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
        console.log('Closing database connection...');
        db.close();

        // Verify the file was created
        if (fs.existsSync(templateDbPath)) {
            const stats = fs.statSync(templateDbPath);
            console.log('Template database created successfully:');
            console.log('- Path:', templateDbPath);
            console.log('- Size:', stats.size, 'bytes');
            console.log('- Created:', stats.birthtime);
            console.log('- Directory contents:', fs.readdirSync(dbDir));
        } else {
            throw new Error('Database file was not created');
        }
    } catch (error) {
        console.error('Error creating template database:');
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        console.error('- Working directory:', process.cwd());
        console.error('- Directory contents:', fs.readdirSync(process.cwd()));
        process.exit(1);
    }
}

// Run the initialization
createTemplateDatabase(); 