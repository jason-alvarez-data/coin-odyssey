import json
import sys
from db_manager import DatabaseManager

def save_coin():
    try:
        # Get data from Electron
        coin_data = json.loads(sys.argv[1])
        
        # Initialize database manager
        db = DatabaseManager()
        
        # Save the coin data
        db.add_coin(coin_data)
        
        # Return success message
        print(json.dumps({"status": "success", "message": "Coin saved successfully"}))
        
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    save_coin()