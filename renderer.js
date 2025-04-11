const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');

// Function to load the dashboard
function loadDashboard() {
    try {
        console.log('Starting dashboard load');
        
        // Load dashboard HTML template
        const dashboardPath = path.join(__dirname, 'src', 'forms', 'dashboard.html');
        console.log('Loading dashboard from:', dashboardPath);
        const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
        document.getElementById('main-content').innerHTML = dashboardContent;

        // Get dashboard data from Python
        const options = {
            mode: 'json',
            scriptPath: 'src/ui/widgets',
            args: ['get_dashboard_data'],
            pythonPath: 'python',
            pythonOptions: ['-u']  // Unbuffered output
        };

        console.log('Running Python script with options:', options);

        PythonShell.run('home_dashboard.py', options, function(err, results) {
            if (err) {
                console.error('Error loading dashboard data:', err);
                // Try to initialize map even if Python fails
                console.log('Initializing map with empty data due to Python error');
                initializeOfflineMap([]);
                return;
            }
            
            try {
                console.log('Raw Python results:', results);
                if (!results || results.length === 0) {
                    console.error('No data received from Python');
                    initializeOfflineMap([]);
                    return;
                }

                const data = JSON.parse(results[0]);
                console.log('Parsed dashboard data:', data);
                
                // Update dashboard stats
                document.getElementById('total-coins').textContent = data.total_coins || 0;
                document.getElementById('unique-countries').textContent = data.unique_countries || 0;
                document.getElementById('unique-years').textContent = data.unique_years || 0;
                document.getElementById('estimated-value').textContent = `$${(data.estimated_value || 0).toFixed(2)}`;

                // Initialize offline map
                console.log('Calling initializeOfflineMap with countries:', data.collection_countries);
                initializeOfflineMap(data.collection_countries || []);
                
                // Update country badges
                updateCountryBadges(data.collection_countries || []);
            } catch (parseError) {
                console.error('Error parsing Python results:', parseError);
                console.log('Initializing map with empty data due to parse error');
                initializeOfflineMap([]);
            }
        });
    } catch (error) {
        console.error('Error in loadDashboard:', error);
        console.log('Initializing map with empty data due to general error');
        initializeOfflineMap([]);
    }
}

function initializeOfflineMap(collectionCountries) {
    console.log('Initializing map with countries:', collectionCountries);
    const mapContainer = document.getElementById('offline-map');
    
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    console.log('Map container dimensions:', {
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        style: mapContainer.style.cssText
    });

    // Make sure the container is visible and has dimensions
    mapContainer.style.height = '400px';
    mapContainer.style.width = '100%';
    mapContainer.style.position = 'relative';
    
    try {
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.error('Leaflet is not loaded!');
            return;
        }
        console.log('Leaflet is available:', L.version);

        // Initialize the Leaflet map
        console.log('Creating Leaflet map');
        const map = L.map('offline-map', {
            maxBounds: [[-90, -180], [90, 180]],
            minZoom: 2,
            maxBoundsViscosity: 1.0
        }).setView([20, 0], 2);

        console.log('Map object created:', map);

        console.log('Adding tile layer');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            noWrap: true,
            bounds: [[-90, -180], [90, 180]]
        }).addTo(map);

        // Load and add the GeoJSON data
        console.log('Loading GeoJSON data');
        const geojsonPath = path.join(__dirname, 'src', 'assets', 'world.geojson');
        console.log('GeoJSON path:', geojsonPath);
        
        const geojsonContent = fs.readFileSync(geojsonPath, 'utf8');
        const geojsonData = JSON.parse(geojsonContent);
        console.log('GeoJSON data loaded, features count:', geojsonData.features.length);

        L.geoJSON(geojsonData, {
            style: function(feature) {
                const countryName = feature.properties.NAME;
                const isCollected = collectionCountries.includes(countryName);
                return {
                    fillColor: isCollected ? '#f5b041' : '#aed6f1',
                    weight: 1,
                    opacity: 1,
                    color: '#2874a6',
                    fillOpacity: isCollected ? 0.7 : 0.3
                };
            },
            onEachFeature: function(feature, layer) {
                const countryName = feature.properties.NAME;
                const isCollected = collectionCountries.includes(countryName);
                layer.bindTooltip(
                    `<strong>${countryName}</strong><br>` +
                    (isCollected ? 'In collection! 🎯' : 'Not collected yet'),
                    {sticky: true}
                );
            }
        }).addTo(map);

        console.log('Map initialization complete');

        // Force a map refresh after a short delay
        setTimeout(() => {
            console.log('Invalidating map size');
            map.invalidateSize();
        }, 100);

    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = `<div class="error-message">Error loading map: ${error.message}</div>`;
    }
}

function updateCountryBadges(collectionCountries) {
    const countryList = document.getElementById('country-badges');
    const countriesCount = document.getElementById('countries-count');
    
    countriesCount.textContent = `You have coins from ${collectionCountries.length} countries`;
    
    countryList.innerHTML = ''; // Clear existing badges
    collectionCountries.sort().forEach(country => {
        const badge = document.createElement('div');
        badge.className = 'country-badge';
        badge.textContent = country;
        countryList.appendChild(badge);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Load dashboard by default
    loadDashboard();

    // Dashboard button click handler
    const dashboardButton = document.querySelector('#menu li:first-child');
    if (dashboardButton) {
        dashboardButton.addEventListener('click', loadDashboard);
    }

    // Add Coin button click handler
    const addCoinButton = document.querySelector('.add-coin');
    if (addCoinButton) {
        addCoinButton.addEventListener('click', function() {
            console.log('Add Coin button clicked');
            try {
                const formPath = path.join(__dirname, 'src', 'forms', 'add_coin_form.html');
                console.log('Loading form from:', formPath);
                
                const formContent = fs.readFileSync(formPath, 'utf8');
                document.getElementById('main-content').innerHTML = formContent;
                setupFormHandlers();
            } catch (error) {
                console.error('Error loading form:', error);
            }
        });
    }
});

// Form handling functions
function setupFormHandlers() {
    const form = document.getElementById('coin-form');
    const cancelButton = document.getElementById('cancel-add');

    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect form data
            const formData = new FormData(form);
            const coinData = Object.fromEntries(formData);

            // Send to Python for database operations
            const options = {
                mode: 'json',
                scriptPath: 'src/database',
                args: [JSON.stringify(coinData)]
            };

            PythonShell.run('save_coin.py', options, function(err, results) {
                if (err) {
                    console.error('Error saving coin:', err);
                    return;
                }
                console.log('Coin saved successfully:', results);
                // Return to dashboard after saving
                loadDashboard();
            });
        });
    }

    // Handle cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            loadDashboard(); // Return to dashboard
        });
    }

    // Handle image uploads
    ['obverse-image', 'reverse-image'].forEach(id => {
        const input = document.getElementById(id);
        const preview = document.getElementById(id.replace('image', 'preview'));
        
        if (input && preview) {
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
}

// Theme switcher
document.getElementById('theme-switch').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
});