# Modern Numismat - Coin Collection Manager

## Overview
Modern Numismat is a personal project born from my passion for numismatics (coin collecting). This desktop application provides collectors with a modern, intuitive interface for managing their coin collections, analyzing their portfolio, and tracking the value of their investments over time.

## Inspiration
This project was inspired by OpenNumismat, an open-source coin collecting software that I used extensively in my collecting journey. While OpenNumismat provided excellent foundational features, I wanted to create a more modern implementation with enhanced data analysis capabilities and a streamlined user interface.

## Features
- **Collection Management**
  - Add and catalog coins with detailed information
  - Track essential details including:
    - Title and year
    - Country of origin
    - Denomination
    - Mint marks
    - Condition grades
    - Purchase information
    - Current market values

- **Data Analysis & Visualization**
  - Value distribution analysis
  - Geographic distribution of collection
  - Timeline view of collection growth
  - Condition analysis across collection
  - Interactive charts and graphs

- **Modern User Interface**
  - Clean, intuitive design
  - Responsive table views
  - Easy-to-use forms
  - Modern styling and interactions

## Technical Details
Built using modern Python technologies:
- PySide6 (Qt) for the user interface
- SQLAlchemy for database management
- Matplotlib for data visualization
- Pandas for data analysis
- SQLite for local data storage

## Future Enhancements
- Image management for coin photographs
- Price tracking integration
- Advanced search and filtering
- Export capabilities
- Bulk import functionality
- Market value estimation

## Getting Started
1. Clone the repository
2. Install dependencies:
```bash
pip install PySide6 matplotlib pandas sqlalchemy pillow
```
3. Run the application:
```bash
python src/main.py
```

## Personal Note
As a coin collector, I understand the importance of maintaining an organized and detailed record of one's collection. This project combines my passion for numismatics with my software development skills, creating a tool that I hope will be useful to other collectors in the community.

## Acknowledgments
Special thanks to the OpenNumismat project and its contributors for inspiring this application and showing what's possible in numismatic software.

## Author
Jason Alvarez

## License
This project is open source and available under the MIT License.