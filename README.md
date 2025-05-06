<div align="center">
  <img src="src/assets/CoinOdyssey_Logo_Final.png" alt="Coin Odyssey Logo" width="200"/>
  <h1>Coin Odyssey</h1>
  <p>A modern, feature-rich desktop application for coin collectors to manage and track their collections.</p>
</div>

## Overview

Coin Odyssey is an Electron-based desktop application designed to help numismatists manage their coin collections with ease. The application provides an intuitive interface for tracking coins, managing collections, and visualizing collection data through an interactive world map.

## Screenshots

### Light Mode
<div align="center">
  <h4>Dashboard</h4>
  <img src="src/assets/screenshots/dashboard_light.png" alt="Dashboard in Light Mode" width="800"/>
  
  <h4>Collection View</h4>
  <img src="src/assets/screenshots/collection_light.png" alt="Collection in Light Mode" width="800"/>
  
  <h4>Analysis</h4>
  <img src="src/assets/screenshots/analysis_light.png" alt="Analysis in Light Mode" width="800"/>
</div>

### Dark Mode
<div align="center">
  <h4>Dashboard</h4>
  <img src="src/assets/screenshots/dashboard_dark.png" alt="Dashboard in Dark Mode" width="800"/>
  
  <h4>Collection View</h4>
  <img src="src/assets/screenshots/collection_dark.png" alt="Collection in Dark Mode" width="800"/>
  
  <h4>Analysis</h4>
  <img src="src/assets/screenshots/analysis_dark.png" alt="Analysis in Dark Mode" width="800"/>
</div>

## Features

- **Interactive World Map**: Visualize your collection's geographic distribution with an interactive SVG map
- **Comprehensive Coin Management**: 
  - Add, edit, and track coins with detailed information
  - Upload images of both obverse and reverse sides
  - Track purchase dates, values, and conditions
- **Advanced Collection Organization**:
  - Filter and search through your entire collection
  - Sort by various attributes (country, year, value, etc.)
  - Organize coins by series, type, and storage location
- **Dynamic Dashboard**:
  - View collection statistics at a glance
  - Track total collection value
  - Monitor collection growth over time
- **Data Analysis**:
  - Geographic distribution charts
  - Collection composition breakdown
  - Value timeline tracking
  - Year distribution visualization
- **Modern UI**:
  - Clean, intuitive interface
  - Dark/Light mode support
  - Responsive design for various screen sizes

## Getting Started

1. **Installation**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/coin-odyssey.git
   
   # Navigate to project directory
   cd coin-odyssey
   
   # Install dependencies
   npm install
   ```

2. **Running the Application**:
   ```bash
   npm start
   ```

## Usage

1. **Adding Coins**:
   - Click the "Add Coin" button in the sidebar
   - Fill in coin details (title, year, country, etc.)
   - Upload obverse and reverse images if available
   - Click "Save" to add to your collection

2. **Viewing Collection**:
   - Use the "Collection" view to see all coins in a table format
   - Filter and sort using the controls above the table
   - Click on any coin to view detailed information

3. **World Map**:
   - Navigate to the "Dashboard" to see the world map
   - Hover over countries to see collection statistics
   - Click on countries to view coins from that region

4. **Managing Collection**:
   - Edit coin details at any time
   - Track purchase prices and current values
   - Organize coins by storage location
   - Export collection data as needed

5. **Data Import/Export**:
   - Backup your collection data
   - Import from CSV, Excel, or JSON files
   - Export your collection for safekeeping

## Technologies Used

- Electron.js
- Node.js
- SQLite
- HTML/CSS/JavaScript
- SVG for interactive mapping
- Chart.js for data visualization

## Using This Project

Feel free to fork this repository and adapt it for your own coin collection needs! While this is primarily a personal project, you're welcome to:

- Fork the repository and customize it for your collection
- Use it as a starting point for your own coin tracking application
- Modify the features to match your collecting style

If you create something cool with this code, I'd love to see it!

## Inspiration

This project was inspired by [OpenNumismat](https://github.com/OpenNumismat/open-numismat), an open-source coin collecting software. While building upon some of their core concepts, Coin Odyssey takes a modern approach with a focus on interactive visualization and user experience.

## Author

Created and maintained by Jason Alvarez

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Modern Numismat Database Fix Utility

This utility helps resolve the SQLite database error "SQLiteError: unable to open database file" that can occur when running Modern Numismat.

## Quick Fix Instructions

1. Run `fix-database.bat` as administrator
2. Try running the Modern Numismat application again

## Detailed Troubleshooting

If the above quick fix doesn't work, follow these detailed steps:

### Option 1: Create a fresh database

1. Run `create-template.bat` as administrator
   - This will create a new template.db file in the current directory
2. Copy the created template.db file to `%APPDATA%\Modern Numismat\coins.db`
   - You can navigate to this location by pressing Win+R and typing `%APPDATA%\Modern Numismat`
   - If the folder doesn't exist, create it first

### Option 2: Manual permission fix

1. Go to the application installation directory (typically `C:\Users\[YourUsername]\AppData\Local\Programs\coin-collecting-app`)
2. Right-click on the installation folder → Properties → Security → Edit
3. Ensure your user account has Full control permissions
4. Click Apply and OK

### Option 3: Reinstall to a path without spaces

The error may occur because your username contains a space ("Jason Code"). Try installing the application to a location without spaces in the path:

1. Uninstall the current version of Modern Numismat
2. Reinstall the application but choose a custom installation directory like `C:\ModernNumismat`

## Technical Details

The SQLite error occurs because the application cannot access or create the database file. This can happen due to:

1. Permission issues with the application directory
2. Path issues when the directory names contain spaces
3. Missing template database file
4. Antivirus software blocking database creation

The fix scripts attempt to create a valid database in the correct location with proper permissions.

## Contact Support

If you continue to experience issues, please contact support with the error details.