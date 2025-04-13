// Required Node.js modules
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Custom modules
const WorldMap = require('./src/components/worldMap.js');
const db = require('./src/database/db.js');

// Theme Constants
const THEME_KEY = 'app-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

// Global variables
let worldMap = null;

document.addEventListener('click', function(e) {
    console.log('Click event:', e.target);
});

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

        // Get dashboard data directly from database
        const allCoins = db.getAllCoins();
        const uniqueCountries = db.getUniqueCountries();

        // Create a map of country names to coin counts
        const countryData = {};
        uniqueCountries.forEach(country => {
            // Count coins for each country
            const countryCoins = allCoins.filter(coin => coin.country === country);
            countryData[country] = countryCoins.length;
        });

        // Calculate dashboard stats
        const dashboardData = {
            total_coins: allCoins.length,
            unique_countries: uniqueCountries.length,
            unique_years: new Set(allCoins.map(coin => coin.year)).size,
            estimated_value: allCoins.reduce((sum, coin) => sum + (coin.current_value || coin.value || 0), 0)
        };
        
        // Update dashboard stats
        document.getElementById('total-coins').textContent = dashboardData.total_coins;
        document.getElementById('unique-countries').textContent = dashboardData.unique_countries;
        document.getElementById('unique-years').textContent = dashboardData.unique_years;
        document.getElementById('estimated-value').textContent = `$${dashboardData.estimated_value.toFixed(2)}`;

        // Update map with collection data
        if (worldMap) {
            worldMap.updateCollection(countryData);  // Pass the country data object directly
        }
        
        // Update country badges
        updateCountryBadges(uniqueCountries);  // Pass just the country names for badges
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
        
        if (!fs.existsSync(collectionPath)) {
            console.error('Collection template not found at:', collectionPath);
            return;
        }
        
        const collectionContent = fs.readFileSync(collectionPath, 'utf8');
        const mainContent = document.getElementById('main-content');
        
        if (!mainContent) {
            console.error('Main content container not found');
            return;
        }
        
        mainContent.innerHTML = collectionContent;

        // Get collection data directly from database
        const coins = db.getAllCoins();
        console.log('Retrieved coins from database:', coins);
        
        populateCollectionTable(coins);
        setupCollectionFilters();

        // Reinitialize theme after loading new content
        initializeTheme();
    } catch (error) {
        console.error('Error in loadCollection:', error);
        // Show error to user
        document.getElementById('main-content').innerHTML = `
            <div class="error-message">
                Error loading collection: ${error.message}
            </div>
        `;
    }
}

// Function to populate the collection table
function populateCollectionTable(coins) {
    const tableBody = document.querySelector('#collection-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    coins.forEach(coin => {
        const row = document.createElement('tr');
        
        // Format the date for display
        const dateCollected = coin.purchase_date ? 
            new Date(coin.purchase_date).toLocaleDateString() : '';
            
        // Add each field in the correct order matching the table headers
        const fields = [
            { key: 'purchase_date', format: v => dateCollected }, // Date Collected
            { key: 'title', format: v => v },                     // Title
            { key: 'year', format: v => v },                      // Year
            { key: 'country', format: v => v },                   // Country
            { key: 'value', format: v => v ? `$${parseFloat(v).toFixed(2)}` : '' }, // Value
            { key: 'unit', format: v => v },                      // Unit
            { key: 'mint', format: v => v },                      // Mint
            { key: 'mint_mark', format: v => v },                 // Mint Mark
            { key: 'status', format: v => v },                    // Status
            { key: 'type', format: v => v },                      // Type
            { key: 'series', format: v => v },                    // Series
            { key: 'storage', format: v => v },                   // Storage
            { key: 'format', format: v => v },                    // Format
            { key: 'region', format: v => v },                    // Region
            { key: 'quantity', format: v => v }                   // Quantity
        ];
        
        fields.forEach(({ key, format }) => {
            const cell = document.createElement('td');
            cell.textContent = format(coin[key] ?? '');
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

// Function to setup collection filters
function setupCollectionFilters() {
    const filterInput = document.getElementById('filter-input');
    if (!filterInput) return;
    
    filterInput.addEventListener('keyup', function() {
        applyFilters();
    });
    
    const applyFilters = () => {
        const filterText = filterInput.value.toLowerCase();
        const rows = document.querySelectorAll('#collection-table tbody tr');
        
        rows.forEach(row => {
            const title = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const year = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const country = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(9)').textContent.toLowerCase();
            const series = row.querySelector('td:nth-child(10)').textContent.toLowerCase();
            
            // Check if any field contains the filter text
            const match = title.includes(filterText) || 
                          year.includes(filterText) || 
                          country.includes(filterText) ||
                          type.includes(filterText) ||
                          series.includes(filterText);
            
            row.style.display = match ? '' : 'none';
        });
    };
    
    // Apply initial filters
    applyFilters();
}

// Function to update country badges
function updateCountryBadges(collectionCountries) {
    const badgeContainer = document.getElementById('country-badges');
    if (!badgeContainer) return;
    
    badgeContainer.innerHTML = '';
    
    collectionCountries.forEach(country => {
        const badge = document.createElement('div');
        badge.className = 'country-badge';
        badge.textContent = country;
        badge.addEventListener('click', () => showCountryCoins(country));
        badgeContainer.appendChild(badge);
    });
}

// Function to show coins from a specific country
function showCountryCoins(countryName) {
    try {
        // Get coins for this country directly from the database
        const allCoins = db.getAllCoins();
        const countryCoins = allCoins.filter(coin => coin.country === countryName);
        
        const coinsContainer = document.getElementById('country-coins');
        if (coinsContainer) {
            coinsContainer.innerHTML = `
                <h3>Coins from ${countryName}</h3>
                <div class="coins-grid">
                    ${countryCoins.map(coin => `
                        <div class="coin-card">
                            <img src="${getCoinImagePath(coin.id) || 'src/assets/default-coin.png'}" alt="${coin.title}">
                            <h4>${coin.title}</h4>
                            <p>Year: ${coin.year}</p>
                            <p>Value: ${coin.value} ${coin.unit}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error showing country coins:', error);
    }
}

// Helper function to get the image path for a coin
function getCoinImagePath(coinId) {
    try {
        const images = db.getCoinImages(coinId);
        const obverseImage = images.find(img => img.image_type === 'obverse');
        return obverseImage ? obverseImage.image_path : null;
    } catch (error) {
        console.error('Error getting coin image:', error);
        return null;
    }
}

// Function to load the add coin form
function loadAddCoinForm() {
    try {
        console.log('Add Coin button clicked');
        
        // Load form HTML
        const formPath = path.join(__dirname, 'src', 'forms', 'add_coin_form.html');
        console.log('Loading form from:', formPath);
        const formContent = fs.readFileSync(formPath, 'utf8');
        document.getElementById('main-content').innerHTML = formContent;
        
        // Set today's date automatically
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const dateCollectedInput = document.getElementById('date-collected');
        if (dateCollectedInput) {
            dateCollectedInput.value = dateString;
        }
        
        // Setup form handlers
        setupFormHandlers();
        
        // Reinitialize theme after loading new content
        initializeTheme();
    } catch (error) {
        console.error('Error loading add coin form:', error);
    }
}

// Function to load the upload collection form
function loadUploadCollectionForm() {
    try {
        console.log('Loading upload collection form');
        
        // Load form HTML
        const formPath = path.join(__dirname, 'src', 'forms', 'upload_collection.html');
        console.log('Loading form from:', formPath);
        const formContent = fs.readFileSync(formPath, 'utf8');
        document.getElementById('main-content').innerHTML = formContent;

        // Setup drag and drop handlers
        const uploadBox = document.getElementById('upload-box');
        const fileInput = document.getElementById('collection-file');
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const importButton = document.getElementById('import-button');
        const cancelButton = document.getElementById('cancel-upload');

        // Remove the click handler from uploadBox completely
        // The label's native handling of the file input is sufficient

        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = 'var(--primary-color)';
            uploadBox.style.backgroundColor = 'var(--hover-color)';
        });

        uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = 'var(--border-color)';
            uploadBox.style.backgroundColor = '';
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            handleFileSelection(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFileSelection(file);
        });

        function handleFileSelection(file) {
            if (file) {
                const extension = file.name.split('.').pop().toLowerCase();
                if (['csv', 'json', 'xlsx'].includes(extension)) {
                    fileName.textContent = file.name;
                    fileInfo.style.display = 'flex';
                    uploadBox.style.borderColor = 'var(--success-color)';
                } else {
                    alert('Please select a valid file format (CSV, JSON, or XLSX)');
                }
            }
        }

        importButton.addEventListener('click', async () => {
            const file = fileInput.files[0] || null;
            if (!file) {
                alert('Please select a file first');
                return;
            }
        
            try {
                importButton.disabled = true;
                importButton.textContent = 'Importing...';
        
                // Read the file content
                const content = await readFileContent(file);
                
                // Process the file based on its type - await the Promise
                const coins = await processFileContent(file.name, content);
                
                // Import coins to database
                let importedCount = 0;
                for (const coin of coins) {
                    try {
                        db.addCoin(coin);
                        importedCount++;
                    } catch (error) {
                        console.error('Error importing coin:', error);
                    }
                }
        
                alert(`Successfully imported ${importedCount} coins!`);
                loadDashboard();
            } catch (error) {
                console.error('Error importing collection:', error);
                alert('Error importing collection: ' + error.message);
            } finally {
                importButton.disabled = false;
                importButton.textContent = 'Import Collection';
            }
        });

        cancelButton.addEventListener('click', () => {
            loadDashboard();
        });

        // Reinitialize theme after loading new content
        initializeTheme();
    } catch (error) {
        console.error('Error loading upload collection form:', error);
    }
}

// Helper function to read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        
        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

// Helper function to process file content based on file type
// Helper function to process file content based on file type
function processFileContent(fileName, content) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'csv':
            // Define field mapping for your CSV structure
            const CSV_FIELD_MAPPING = {
                'coin_id': 'id',
                'country': 'country',
                'format': 'format',
                'mint': 'mint',
                'mintmark': 'mint_mark',
                'quantity': 'quantity',
                'region': 'region',
                'status': 'status',
                'title': 'title',
                'type': 'type',
                'unit': 'unit',
                'value': 'value',
                'year': 'year',
                'series': 'series',
                'storage': 'storage'
                // Skip other fields that aren't in our database:
                // category, subjectshort, period, features
            };

            return new Promise((resolve, reject) => {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        try {
                            const coins = results.data.map(row => {
                                // Create a new object with mapped fields
                                const coin = {};
                                
                                // Map each field according to our mapping
                                Object.entries(CSV_FIELD_MAPPING).forEach(([csvField, dbField]) => {
                                    if (dbField && row[csvField] !== undefined) {
                                        // Handle specific field transformations
                                        switch (dbField) {
                                            case 'year':
                                                coin[dbField] = parseInt(row[csvField]) || null;
                                                break;
                                            case 'value':
                                                coin[dbField] = parseFloat(row[csvField]) || null;
                                                break;
                                            case 'quantity':
                                                coin[dbField] = parseInt(row[csvField]) || 1;
                                                break;
                                            default:
                                                coin[dbField] = row[csvField] || null;
                                        }
                                    }
                                });

                                // Validate required fields
                                if (!coin.title || !coin.year || !coin.country) {
                                    console.warn('Skipping coin due to missing required fields:', row);
                                    return null;
                                }

                                return coin;
                            })
                            // Filter out any null entries (skipped coins)
                            .filter(coin => coin !== null);

                            resolve(coins);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            });
            
        case 'json':
            return Promise.resolve(JSON.parse(content));
            
        case 'xlsx':
            // Add Excel parsing logic here if needed
            return Promise.resolve([]);
            
        default:
            return Promise.reject(new Error('Unsupported file format'));
    }
}

// Function to setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('coin-form');
    const cancelButton = document.getElementById('cancel-add');
    
    // Setup image preview handlers
    setupImagePreviewHandlers();

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            
            // Create coin data object with proper type conversions
            const coinData = {
                title: formData.get('title'),
                year: parseInt(formData.get('year')) || new Date().getFullYear(),
                country: formData.get('country'),
                value: parseFloat(formData.get('value')) || 0,
                unit: formData.get('unit'),
                mint: formData.get('mint'),
                mint_mark: formData.get('mint_mark'),
                type: formData.get('type') || 'Regular Issue',
                format: formData.get('format') || 'Single',
                series: formData.get('series'),
                region: formData.get('region') || 'Americas',
                storage: formData.get('storage'),
                status: formData.get('status') || 'owned',
                quantity: parseInt(formData.get('quantity')) || 1,
                purchase_date: formData.get('purchase_date') || new Date().toISOString().split('T')[0],
                purchase_price: parseFloat(formData.get('purchase_price')) || 0,
                current_value: parseFloat(formData.get('value')) || 0 // Initially set to purchase value
            };

            // Clean up empty strings to null
            Object.keys(coinData).forEach(key => {
                if (coinData[key] === '') {
                    coinData[key] = null;
                }
            });

            console.log('Submitting coin data:', coinData);
            
            // Show a loading indicator
            const saveButton = document.getElementById('save-coin');
            const originalText = saveButton.innerHTML;
            saveButton.innerHTML = 'Saving...';
            saveButton.disabled = true;

            try {
                // Save coin to database
                const coinId = db.addCoin(coinData);
                
                // Handle image uploads if present
                const obverseFile = formData.get('obverse_image');
                const reverseFile = formData.get('reverse_image');
                
                if (obverseFile && obverseFile.size > 0) {
                    const imagePath = saveImageFile(obverseFile, 'obverse');
                    db.addCoinImage({
                        coin_id: coinId,
                        image_path: imagePath,
                        image_type: 'obverse'
                    });
                }
                
                if (reverseFile && reverseFile.size > 0) {
                    const imagePath = saveImageFile(reverseFile, 'reverse');
                    db.addCoinImage({
                        coin_id: coinId,
                        image_path: imagePath,
                        image_type: 'reverse'
                    });
                }
                
                // Success!
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
                alert('Coin saved successfully!');
                loadDashboard(); // Return to dashboard
            } catch (error) {
                console.error('Error saving coin:', error);
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
                alert('Failed to save coin: ' + error.message);
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            loadDashboard();
        });
    }
}

// Helper function to save an image file
function saveImageFile(file, type) {
    try {
        // Create images directory if it doesn't exist
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        // Create a unique filename
        const timestamp = Date.now();
        const filename = `${type}_${timestamp}_${file.name}`;
        const outputPath = path.join(imagesDir, filename);
        
        // Read file data as array buffer
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        
        // Wait for file to be read
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                try {
                    // Write file to disk
                    const buffer = Buffer.from(reader.result);
                    fs.writeFileSync(outputPath, buffer);
                    resolve(outputPath);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
        });
    } catch (error) {
        console.error('Error saving image file:', error);
        throw error;
    }
}

// Function to setup image preview handlers
function setupImagePreviewHandlers() {
    const obverseInput = document.getElementById('obverse-image');
    const reverseInput = document.getElementById('reverse-image');
    const obversePreview = document.getElementById('obverse-preview');
    const reversePreview = document.getElementById('reverse-preview');
    
    if (obverseInput && obversePreview) {
        obverseInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    obversePreview.innerHTML = `<img src="${e.target.result}" alt="Obverse Preview">`;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    if (reverseInput && reversePreview) {
        reverseInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    reversePreview.innerHTML = `<img src="${e.target.result}" alt="Reverse Preview">`;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Setup drag and drop for image previews
    [obversePreview, reversePreview].forEach(preview => {
        if (!preview) return;
        
        preview.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.border = '2px solid #007bff';
        });
        
        preview.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.border = '2px dashed #ccc';
        });
        
        preview.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.border = '2px dashed #ccc';
            
            const files = e.dataTransfer.files;
            if (files && files[0]) {
                const isObverse = this.id === 'obverse-preview';
                const input = isObverse ? obverseInput : reverseInput;
                
                // Set the file in the input
                if (input) {
                    input.files = files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            }
        });
    });
}

// Function to check database file
function checkDatabaseFile() {
    try {
        const coinCount = db.getCoinCount();
        const countries = db.getUniqueCountries();
        
        console.log(`Database coin count: ${coinCount}`);
        console.log(`Unique countries: ${countries.join(', ')}`);
        
        return {
            coinCount,
            countries
        };
    } catch (error) {
        console.error('Error checking database:', error);
        return {
            coinCount: 0,
            countries: []
        };
    }
}

// Initialize application when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded, initializing app');
    
    // Initialize theme
    initializeTheme();
    
    // Load dashboard by default
    loadDashboard();
    
    // Check database on startup
    checkDatabaseFile();
    
    // Add event listeners to sidebar buttons
    document.querySelectorAll('.sidebar-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            document.querySelectorAll('.sidebar-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const view = this.dataset.view;
            console.log(`Navigation: ${view}`);
            
            switch (view) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'collection':
                    loadCollection();
                    break;
                case 'add':
                    loadAddCoinForm();
                    break;
                case 'analysis':
                    loadAnalysis();
                    break;
                case 'upload':
                    loadUploadCollectionForm();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                default:
                    console.warn(`Unknown view: ${view}`);
            }
        });
    });

    // Theme switcher
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
});