import json
import sys
import os
import traceback

# Then your existing import code for DatabaseManager
try:
    from db_manager import DatabaseManager
except ImportError:
    from database.db_manager import DatabaseManager

def save_coin():
    try:
        # Get data from Electron
        coin_data = json.loads(sys.argv[1])
        
        # Print received data for debugging
        print(f"DEBUG: Received data: {coin_data}", file=sys.stderr)
        
        # Initialize database manager
        db = DatabaseManager()
        
        # Save the coin data
        coin_id = db.add_coin(coin_data)
        
        # Return success message with the new coin ID
        print(json.dumps({"status": "success", "message": "Coin saved successfully", "coin_id": coin_id}))
        
    except Exception as e:
        # Print full stack trace for debugging
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    save_coin()