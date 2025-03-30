import os               # For directory operations
import requests        # For downloading files from the internet
import json            # For JSON formatting

def download_world_map():
    # Create the src/assets directory if it doesn't exist
    os.makedirs('src/assets', exist_ok=True)
    
    # URL for the world map GeoJSON file
    url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    
    print("Downloading world map data...")
    
    try:
        # Make HTTP GET request to download the file
        response = requests.get(url)
        
        # Check if the download was successful
        if response.status_code == 200:
            # Parse the JSON data
            geojson_data = response.json()
            
            # Write the formatted JSON data to file
            with open('src/assets/world.geojson', 'w', encoding='utf-8') as f:
                json.dump(geojson_data, f, indent=2)
            
            print("Successfully downloaded and formatted world map data to src/assets/world.geojson")
        else:
            print(f"Failed to download world map data. Status code: {response.status_code}")
    
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    download_world_map()