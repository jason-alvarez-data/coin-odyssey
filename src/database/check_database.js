const path = require('path');
const db = require('./db.js');

function checkDatabase() {
    try {
        // Get all coins
        const allCoins = db.getAllCoins();
        
        // Get basic stats
        const totalCoins = allCoins.length;
        
        // Get the most recent coin
        const mostRecent = totalCoins > 0 ? allCoins[allCoins.length - 1] : null;
        
        // Format results as JSON
        const result = {
            status: "success",
            total_coins: totalCoins,
            database_file: path.resolve("coins.db"),
            most_recent: mostRecent ? {
                id: mostRecent.id,
                title: mostRecent.title,
                country: mostRecent.country
            } : null
        };
        
        console.log(JSON.stringify(result));
        return result;
    } catch (e) {
        const error = {
            status: "error", 
            message: e.message
        };
        console.error(JSON.stringify(error));
        return error;
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    checkDatabase();
}

// Export for use in other files
module.exports = checkDatabase;