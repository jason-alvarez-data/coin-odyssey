const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');
const WorldMap = require('./src/ui/widgets/worldMap');

// Theme Constants
const THEME_KEY = 'app-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

let worldMap = null;

// Theme initialization function
function initializeTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    if (!themeSwitch) return;

    // Get saved theme or default to light
    const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    
    // Set initial theme
    document.body.setAttribute('data-theme', savedTheme);
    themeSwitch.checked = savedTheme === DARK_THEME;

    // Add change event listener
    themeSwitch.addEventListener('change', function() {
        const newTheme = this.checked ? DARK_THEME : LIGHT_THEME;
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

// Function to load the dashboard
function loadDashboard() {
    try {
        console.log('Starting dashboard load');
        
        // Load dashboard HTML template
        const dashboardPath = path.join(__dirname, 'src', 'forms', 'dashboard.html');
        console.log('Loading dashboard from:', dashboardPath);
        const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
        document.getElementById('main-content').innerHTML = dashboardContent;

        // Initialize the world map
        worldMap = new WorldMap('world-map');
        worldMap.initialize();

        // Add event listener for country selection
        document.getElementById('world-map').addEventListener('country-selected', (e) => {
            const countryName = e.detail.country;
            console.log(`Selected country: ${countryName}`);
            showCountryCoins(countryName);
        });

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
                return;
            }
            
            try {
                if (!results || results.length === 0) {
                    console.error('No data received from Python');
                    return;
                }

                const data = JSON.parse(results[0]);
                console.log('Parsed dashboard data:', data);
                
                // Update dashboard stats
                document.getElementById('total-coins').textContent = data.total_coins || 0;
                document.getElementById('unique-countries').textContent = data.unique_countries || 0;
                document.getElementById('unique-years').textContent = data.unique_years || 0;
                document.getElementById('estimated-value').textContent = `$${(data.estimated_value || 0).toFixed(2)}`;

                // Update map with collection data
                if (worldMap) {
                    worldMap.updateCollection(data.collection_countries || []);
                }
                
                // Update country badges
                updateCountryBadges(data.collection_countries || []);
            } catch (parseError) {
                console.error('Error parsing Python results:', parseError);
            }
        });
    } catch (error) {
        console.error('Error in loadDashboard:', error);
    }
}

// Function to load the collection view
function loadCollection() {
    try {
        console.log('Loading collection view');
        
        // Load collection HTML template
        const collectionPath = path.join(__dirname, 'src', 'forms', 'collection.html');
        console.log('Loading collection from:', collectionPath);
        const collectionContent = fs.readFileSync(collectionPath, 'utf8');
        document.getElementById('main-content').innerHTML = collectionContent;

        // Get collection data from Python
        const options = {
            mode: 'json',
            scriptPath: 'src/ui/widgets',
            args: ['get_collection_data'],
            pythonPath: 'python'
        };

        PythonShell.run('coin_table_widget.py', options, function(err, results) {
            if (err) {
                console.error('Error loading collection data:', err);
                return;
            }

            try {
                const data = JSON.parse(results[0]);
                populateCollectionTable(data);
                setupCollectionFilters();
            } catch (parseError) {
                console.error('Error parsing collection data:', parseError);
            }
        });

        // Reinitialize theme after loading new content
        initializeTheme();
    } catch (error) {
        console.error('Error in loadCollection:', error);
    }
}

function populateCollectionTable(coins) {
    const tbody = document.querySelector('#collection-table tbody');
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    tbody.innerHTML = '';

    coins.forEach(coin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coin.title || ''}</td>
            <td>${coin.year || ''}</td>
            <td>${coin.country || ''}</td>
            <td>${coin.value || ''}</td>
            <td>${coin.unit || ''}</td>
            <td>${coin.mint || ''}</td>
            <td>${coin.mint_mark || ''}</td>
            <td>${coin.status || ''}</td>
            <td>${coin.type || ''}</td>
            <td>${coin.series || ''}</td>
            <td>${coin.storage || ''}</td>
            <td>${coin.format || ''}</td>
            <td>${coin.region || ''}</td>
            <td>${coin.quantity || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

function setupCollectionFilters() {
    const searchInput = document.getElementById('search-input');
    const searchField = document.getElementById('search-field');
    const conditionFilter = document.getElementById('condition-filter');
    const valueFilter = document.getElementById('value-filter');

    if (!searchInput || !searchField || !conditionFilter || !valueFilter) {
        console.error('One or more filter elements not found');
        return;
    }

    const applyFilters = () => {
        const options = {
            mode: 'json',
            scriptPath: 'src/ui/widgets',
            args: [
                'apply_filters',
                searchInput.value,
                searchField.value,
                conditionFilter.value,
                valueFilter.value
            ],
            pythonPath: 'python'
        };

        PythonShell.run('coin_table_widget.py', options, function(err, results) {
            if (err) {
                console.error('Error applying filters:', err);
                return;
            }
            try {
                const data = JSON.parse(results[0]);
                populateCollectionTable(data);
            } catch (parseError) {
                console.error('Error parsing filter results:', parseError);
            }
        });
    };

    // Add event listeners
    searchInput.addEventListener('input', applyFilters);
    searchField.addEventListener('change', applyFilters);
    conditionFilter.addEventListener('change', applyFilters);
    valueFilter.addEventListener('change', applyFilters);
}

function updateCountryBadges(collectionCountries) {
    const countryList = document.getElementById('country-badges');
    const countriesCount = document.getElementById('countries-count');
    
    if (!countryList || !countriesCount) return;
    
    countriesCount.textContent = `You have coins from ${collectionCountries.length} countries`;
    
    countryList.innerHTML = ''; // Clear existing badges
    collectionCountries.sort().forEach(country => {
        const badge = document.createElement('div');
        badge.className = 'country-badge';
        badge.textContent = country;
        countryList.appendChild(badge);
    });
}

function showCountryCoins(countryName) {
    const options = {
        mode: 'json',
        scriptPath: 'src/database',
        args: [JSON.stringify(coinData)],
        pythonOptions: ['-u'],  // Unbuffered output for better debugging
        stderrParser: line => console.error(`Python stderr: ${line}`),  // Log stderr output
        stdoutParser: line => console.log(`Python stdout: ${line}`)     // Log stdout output
    };

    console.log('PythonShell options:', JSON.stringify(options, null, 2));

    PythonShell.run('home_dashboard.py', options, function(err, results) {
        if (err) {
            console.error('Error loading country coins:', err);
            return;
        }

        try {
            const coins = JSON.parse(results[0]);
            const coinsContainer = document.getElementById('country-coins');
            if (coinsContainer) {
                coinsContainer.innerHTML = `
                    <h3>Coins from ${countryName}</h3>
                    <div class="coins-grid">
                        ${coins.map(coin => `
                            <div class="coin-card">
                                <img src="${coin.image || 'src/assets/default-coin.png'}" alt="${coin.name}">
                                <h4>${coin.name}</h4>
                                <p>Year: ${coin.year}</p>
                                <p>Value: $${coin.value.toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (parseError) {
            console.error('Error parsing country coins:', parseError);
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Initialize theme
    initializeTheme();
    
    // Load dashboard by default
    loadDashboard();

    // Dashboard button click handler
    const dashboardButton = document.querySelector('#menu li:nth-child(1)');
    if (dashboardButton) {
        dashboardButton.addEventListener('click', loadDashboard);
    }

    // Collection button click handler
    const collectionButton = document.querySelector('#menu li:nth-child(2)');
    if (collectionButton) {
        collectionButton.addEventListener('click', loadCollection);
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
                
                // Reinitialize theme after loading new content
                initializeTheme();
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

    // Setup image preview handlers
    const obverseInput = document.getElementById('obverse-image');
    const reverseInput = document.getElementById('reverse-image');
    const obversePreview = document.getElementById('obverse-preview');
    const reversePreview = document.getElementById('reverse-preview');

    // Handle obverse image preview
    if (obverseInput && obversePreview) {
        obverseInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    obversePreview.innerHTML = `<img src="${e.target.result}" alt="Obverse Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Make the preview clickable
        obversePreview.addEventListener('click', function() {
            obverseInput.click();
        });
    }

    // Handle reverse image preview
    if (reverseInput && reversePreview) {
        reverseInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    reversePreview.innerHTML = `<img src="${e.target.result}" alt="Reverse Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Make the preview clickable
        reversePreview.addEventListener('click', function() {
            reverseInput.click();
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const coinData = {};
            
            // Process form fields and ensure required fields have values
            for (let [key, value] of formData.entries()) {
                // Skip file inputs
                if (key !== 'obverse_image' && key !== 'reverse_image') {
                    // Make sure empty string fields are set to null
                    coinData[key] = value.trim() === '' ? null : value;
                }
            }
            
            // Add default values for required fields if not provided
            if (!coinData.year || coinData.year === null) {
                coinData.year = new Date().getFullYear(); // Current year
            }
            
            if (!coinData.quantity || coinData.quantity === null) {
                coinData.quantity = 1; // Default quantity
            }
            
            if (!coinData.value || coinData.value === null) {
                coinData.value = 0; // Default value
            }
            
            if (!coinData.status || coinData.status === null) {
                coinData.status = 'owned'; // Default status
            }
            
            if (!coinData.type || coinData.type === null) {
                coinData.type = 'Regular Issue'; // Default type
            }
            
            if (!coinData.format || coinData.format === null) {
                coinData.format = 'Single'; // Default format
            }
            
            if (!coinData.region || coinData.region === null) {
                coinData.region = 'Americas'; // Default region if not specified
            }
            
            // Add image data if available
            const obverseFile = formData.get('obverse_image');
            const reverseFile = formData.get('reverse_image');
            
            if (obverseFile && obverseFile.size > 0) {
                coinData.has_obverse_image = true;
            }
            
            if (reverseFile && reverseFile.size > 0) {
                coinData.has_reverse_image = true;
            }
            
            console.log('Submitting coin data:', coinData);
            
            const options = {
                mode: 'json',
                scriptPath: 'src/database',
                args: [JSON.stringify(coinData)],
                pythonOptions: ['-u'],  // Unbuffered output for better debugging
                stderrParser: line => console.error(`Python stderr: ${line}`),  // Log stderr output
                stdoutParser: line => console.log(`Python stdout: ${line}`)     // Log stdout output
            };
            
            console.log('PythonShell options:', JSON.stringify(options, null, 2));
            
            // Show a loading indicator
            const saveButton = document.getElementById('save-coin');
            const originalText = saveButton.innerHTML;
            saveButton.innerHTML = 'Saving...';
            saveButton.disabled = true;

            try {
                PythonShell.run('save_coin.py', options, function(err, results) {
                    // Always restore button state
                    saveButton.innerHTML = originalText;
                    saveButton.disabled = false;
                    
                    if (err) {
                        console.error('Error saving coin:', err);
                        alert('Failed to save coin: ' + (err.message || 'Unknown error'));
                        return;
                    }
                    
                    try {
                        console.log('Python response:', results);
                        
                        // Check if we got valid results
                        if (!results || !results.length) {
                            alert('No response from server. The coin may not have been saved.');
                            return;
                        }
                        
                        const response = typeof results[0] === 'string' ? JSON.parse(results[0]) : results[0];
                        
                        if (response && response.status === 'success') {
                            console.log('Coin saved successfully:', response);
                            alert('Coin saved successfully!');
                            loadDashboard();
                        } else {
                            console.error('Error in Python response:', response);
                            alert('Failed to save coin: ' + (response.message || 'Unknown error'));
                        }
                    } catch (parseError) {
                        console.error('Error parsing Python response:', parseError);
                        alert('Error processing server response. The coin may not have been saved.');
                    }
                });
            } catch (execError) {
                // If PythonShell.run itself throws an error, restore button state
                console.error('Error executing Python script:', execError);
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
                alert('Failed to execute save operation: ' + (execError.message || 'Unknown error'));
            }

            // Call this after trying to save a coin
            checkDatabaseFile();
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            loadDashboard();
        });
    }
}

// Add this function to your renderer.js
function checkDatabaseFile() {
    try {
        const dbPath = path.join(__dirname, 'coins.db');
        const exists = fs.existsSync(dbPath);
        const stats = exists ? fs.statSync(dbPath) : null;
        
        console.log(`Database file exists: ${exists}`);
        if (exists) {
            console.log(`Database file size: ${stats.size} bytes`);
            console.log(`Last modified: ${stats.mtime}`);
        }
        
        // Call a Python script to count coins
        const options = {
            mode: 'json',
            scriptPath: 'src/database',
            args: ['count_coins'],
            pythonOptions: ['-u']
        };
        
        PythonShell.run('check_database.py', options, function(err, results) {
            if (err) {
                console.error('Error checking database:', err);
                return;
            }
            
            console.log('Database check results:', results);
        });
    } catch (error) {
        console.error('Error checking database file:', error);
    }
}