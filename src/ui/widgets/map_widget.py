import os
import json
import tempfile
import country_converter as coco
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtCore import QUrl, Qt

class CollectionMapWidget(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()
        self.update_map()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Create loading label
        self.loading_label = QLabel("Loading map...")
        self.loading_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 14px;
            padding: 20px;
        """)
        layout.addWidget(self.loading_label)

        # Create web view for the map
        self.web_view = QWebEngineView()
        self.web_view.setStyleSheet("""
            background-color: white;
        """)
        self.web_view.loadFinished.connect(self._on_load_finished)
        layout.addWidget(self.web_view)

    def _on_load_finished(self, success):
        """Called when the web view finishes loading"""
        if success:
            print("Map loaded successfully!")
            self.loading_label.setVisible(False)
        else:
            print("Failed to load map")
            self.show_error_message("Failed to load map. Please try refreshing.")

    def show_error_message(self, message):
        """Show error message in the widget"""
        if hasattr(self, 'loading_label'):
            self.loading_label.setText(message)
            self.loading_label.setStyleSheet(f"""
                color: red;
                font-size: 14px;
                padding: 20px;
            """)

    def update_map(self):
        try:
            # Enable JavaScript and other required settings
            settings = self.web_view.page().settings()
            settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
            settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
            settings.setAttribute(QWebEngineSettings.WebAttribute.AllowRunningInsecureContent, True)
            
            print("Updating map...")
            self.loading_label.setText("Loading map...")
            self.loading_label.setVisible(True)
            
            coins = self.db_manager.get_all_coins()
            collection_countries = set(coin.country for coin in coins if coin.country)
            print(f"Found {len(collection_countries)} countries in collection")
            
            # Convert country names to ISO codes
            cc = coco.CountryConverter()
            collection_iso_codes = set(cc.convert(names=list(collection_countries), to='ISO2'))
            
            # Read the GeoJSON file
            with open('src/assets/world.geojson', 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)

            # Update the script section to properly initialize the map
            script_content = """
                <script>
                    window.addEventListener('load', function() {
                        try {
                            const map = L.map('map').setView([20, 0], 2);  // Added map initialization
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap contributors'
                            }).addTo(map);

                            const geojsonData = %s;
                            const collectionCountries = %s;

                            L.geoJSON(geojsonData, {
                                style: function(feature) {
                                    const isCollected = collectionCountries.includes(feature.properties.ISO_A2);
                                    return {
                                        fillColor: isCollected ? '#f5b041' : '#aed6f1',
                                        weight: 1,
                                        opacity: 1,
                                        color: '#2874a6',
                                        fillOpacity: isCollected ? 0.7 : 0.3
                                    };
                                },
                                onEachFeature: function(feature, layer) {
                                    const isCollected = collectionCountries.includes(feature.properties.ISO_A2);
                                    layer.bindTooltip(
                                        `<strong>${feature.properties.NAME}</strong><br>` +
                                        (isCollected ? 'In collection! 🎯' : 'Not collected yet'),
                                        {sticky: true}
                                    );
                                }
                            }).addTo(map);
                        } catch (error) {
                            console.error('Error initializing map:', error);
                        }
                    });
                </script>
            """ % (json.dumps(geojson_data), json.dumps(list(collection_iso_codes)))

            # Update the HTML content with the new script
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>World Coin Collection Map</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
                    crossorigin=""/>
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
                    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
                    crossorigin=""></script>
                <style>
                    body {{
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }}
                    .container {{
                        max-width: 1200px;
                        margin: 0 auto;
                    }}
                    #map {{
                        height: 500px;
                        width: 100%;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }}
                    .world-map-title {{
                        color: {self.theme_manager.get_color('text')};
                        font-size: 24px;
                        margin-bottom: 10px;
                        text-align: center;
                    }}
                    .subtitle {{
                        color: {self.theme_manager.get_color('text_secondary')};
                        text-align: center;
                        margin-bottom: 20px;
                    }}
                    .country-list {{
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: center;
                        margin-top: 20px;
                    }}
                    .country-badge {{
                        background-color: {self.theme_manager.get_color('accent')};
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        transition: transform 0.2s;
                    }}
                    .country-badge:hover {{
                        transform: scale(1.05);
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="world-map-title">World Coin Collection Map</div>
                    <div class="subtitle">You have coins from {len(collection_countries)} countries</div>
                    <div id="map"></div>
                    <div class="country-list">
                        {' '.join(f'<div class="country-badge">{country}</div>' for country in sorted(collection_countries))}
                    </div>
                </div>
                {script_content}
            </body>
            </html>
            """
            
            # Save to temporary file
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, 'coin_map.html')
            
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
                
            print(f"Saving map to: {temp_path}")
            
            # Load in WebView
            print("Loading map in WebView...")
            self.web_view.setUrl(QUrl.fromLocalFile(temp_path))
            
        except Exception as e:
            print(f"Error updating map: {str(e)}")
            self.show_error_message(f"Error updating map: {str(e)}")

    def update_theme(self):
        """Update the theme of the widget"""
        self.loading_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 14px;
            padding: 20px;
        """)