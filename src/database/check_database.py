import json
import sys
import os

try:
    from db_manager import DatabaseManager
except ImportError:
    from database.db_manager import DatabaseManager

def check_database():
    try:
        db = DatabaseManager()
        all_coins = db.get_all_coins()
        
        # Get basic stats
        total_coins = len(all_coins)
        
        # Get the most recent coin
        most_recent = all_coins[-1] if all_coins else None
        
        # Format results as JSON
        result = {
            "status": "success",
            "total_coins": total_coins,
            "database_file": os.path.abspath("coins.db"),
            "most_recent": {
                "id": most_recent.id,
                "title": most_recent.title,
                "country": most_recent.country
            } if most_recent else None
        }
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    check_database()