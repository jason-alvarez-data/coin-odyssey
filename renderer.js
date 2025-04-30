// Theme Constants
const THEME_KEY = 'app-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

// Global variables
let worldMap = null;
let currentView = 'dashboard'; // Track the current view, default to dashboard
// Store chart references for cleanup
let charts = {};

// Chart configuration helper
function createChart(ctx, config) {
    try {
        if (!ctx || !ctx.canvas) {
            console.error('Invalid canvas context provided');
            return null;
        }
        
        const canvasId = ctx.canvas.id;
        
        // Attempt to get existing chart by ID
        const existingChart = Chart.getChart(ctx.canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Create new chart
        const chart = new Chart(ctx, config);
        charts[canvasId] = chart;
        return chart;
    } catch (error) {
        console.error('Error creating chart:', error);
        return null;
    }
}

// Add navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup navigation
    document.querySelectorAll('.sidebar-button').forEach(button => {
        button.addEventListener('click', async () => {
            const view = button.getAttribute('data-view');
            
            // Remove active class from all buttons
            document.querySelectorAll('.sidebar-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Store previous view before navigating to add coin
            if (view === 'add') {
                sessionStorage.setItem('previousView', currentView);
            }

            // Load the appropriate view
            try {
                switch (view) {
                    case 'dashboard':
                        await loadDashboard();
                        break;
                    case 'collection':
                        await loadCollection();
                        break;
                    case 'analysis':
                        await loadAnalysis();
                        break;
                    case 'upload':
                        await loadUploadCollection();
                        break;
                    case 'settings':
                        await loadSettings();
                        break;
                    case 'add':
                        await loadAddCoin();
                        break;
                    default:
                        console.error(`Unknown view: ${view}`);
                }
            } catch (error) {
                console.error(`Error loading ${view} view:`, error);
                window.electronAPI.reportError(error);
            }
        });
    });

    // Setup theme toggle switch
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', async () => {
            const theme = themeSwitch.checked ? DARK_THEME : LIGHT_THEME;
            await window.electronAPI.setSetting(THEME_KEY, theme);
            await window.electronAPI.setTheme(theme);
            document.documentElement.setAttribute('data-theme', theme);
        });
    }

    // Initialize the application
    initializeTheme();
    loadDashboard();
});

// Helper function to navigate back to the previous view or a default
async function navigateBack(defaultView = 'dashboard') {
    const previousView = sessionStorage.getItem('previousView') || defaultView;
    console.log(`Navigating back to: ${previousView}`);
    sessionStorage.removeItem('previousView'); // Clear after use

    // Find the corresponding button and click it to load the view
    const button = document.querySelector(`.sidebar-button[data-view="${previousView}"]`);
    if (button) {
        button.click(); // Simulate click to ensure active state and loading logic run
    } else {
        console.warn(`Could not find button for view: ${previousView}. Loading default: ${defaultView}`);
        // Fallback to loading directly if button not found (shouldn't happen ideally)
        switch (defaultView) {
            case 'dashboard': await loadDashboard(); break;
            case 'collection': await loadCollection(); break;
            // Add other cases if needed
            default: await loadDashboard();
        }
    }
}

// Function to load the dashboard
async function loadDashboard() {
    currentView = 'dashboard'; // Set current view
    try {
        console.log('Starting dashboard load');
        
        // Load dashboard HTML template
        const dashboardContent = await window.electronAPI.readFile('src/forms/dashboard.html');
        document.getElementById('main-content').innerHTML = dashboardContent;

        // Load the WorldMap class
        await import('./src/components/worldMap.js');

        // Get dashboard data
        const allCoins = await window.electronAPI.getAllCoins();
        const uniqueCountries = await window.electronAPI.getUniqueCountries();

        // Create a map of country names to coin counts
        const countryData = {};
        uniqueCountries.forEach(country => {
            const countryCoins = allCoins.filter(coin => coin.country === country);
            countryData[country] = countryCoins.length;
        });

        // Initialize the world map
        if (worldMap) {
            worldMap.destroy(); // Clean up any existing map instance
        }
        worldMap = new WorldMap('world-map', countryData);
        await worldMap.initialize();

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
            await window.electronAPI.updateMapData(countryData);
            worldMap.updateCollection(countryData);
        }

    } catch (error) {
        console.error('Error in loadDashboard:', error);
        window.electronAPI.reportError(error);
        
        // Show error message in the dashboard
        document.getElementById('main-content').innerHTML = `
            <div class="error-message">
                <h3>Error Loading Dashboard</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Function to load the collection view
async function loadCollection() {
    currentView = 'collection'; // Set current view
    try {
        console.log('Loading collection view');
        
        const collectionContent = await window.electronAPI.readFile('src/forms/collection.html');
        document.getElementById('main-content').innerHTML = collectionContent;

        const coins = await window.electronAPI.getAllCoins();
        console.log('Retrieved coins from database:', coins);
        
        await populateCollectionTable(coins);
        setupCollectionFilters();
        await initializeTheme();
    } catch (error) {
        console.error('Error in loadCollection:', error);
        window.electronAPI.reportError(error);
        document.getElementById('main-content').innerHTML = `
            <div class="error-message">
                Error loading collection: ${error.message}
            </div>
        `;
    }
}

// Function to populate the collection table
async function populateCollectionTable(coins) {
    const tableBody = document.querySelector('#collection-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    coins.forEach(coin => {
        const row = document.createElement('tr');
        
        const dateCollected = coin.purchase_date ? 
            dateFns.format(new Date(coin.purchase_date), 'yyyy-MM-dd') : '';
            
        const fields = [
            { key: 'purchase_date', format: v => dateCollected },
            { key: 'title', format: v => v },
            { key: 'year', format: v => v },
            { key: 'country', format: v => v },
            { key: 'value', format: v => v ? `$${parseFloat(v).toFixed(2)}` : '' },
            { key: 'unit', format: v => v },
            { key: 'mint', format: v => v },
            { key: 'mint_mark', format: v => v },
            { key: 'status', format: v => v },
            { key: 'type', format: v => v },
            { key: 'series', format: v => v },
            { key: 'storage', format: v => v },
            { key: 'format', format: v => v },
            { key: 'region', format: v => v },
            { key: 'quantity', format: v => v }
        ];
        
        fields.forEach(({ key, format }) => {
            const cell = document.createElement('td');
            cell.textContent = format(coin[key] ?? '');
            row.appendChild(cell);
        });

        const actionsCell = document.createElement('td');
        actionsCell.className = 'coin-actions';
        actionsCell.innerHTML = `
            <button class="edit-button" data-coin-id="${coin.id}">
                <span class="icon">✏️</span>
            </button>
            <button class="delete-button" data-coin-id="${coin.id}">
                <span class="icon">🗑️</span>
            </button>
        `;
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });

    await setupActionButtons();
}

// Function to setup collection filters
function setupCollectionFilters() {
    const searchInput = document.getElementById('search-input');
    const searchField = document.getElementById('search-field');
    
    if (searchInput && searchField) {
        searchInput.addEventListener('input', async function() {
            const searchText = this.value.toLowerCase();
            const searchFieldValue = searchField.value;
            
            try {
                const filteredCoins = await window.electronAPI.searchCoins(searchText, searchFieldValue);
                await populateCollectionTable(filteredCoins);
            } catch (error) {
                console.error('Error searching coins:', error);
                window.electronAPI.reportError(error);
            }
        });
    }
}

// Function to load analysis view
async function loadAnalysis() {
    currentView = 'analysis'; // Set current view
    try {
        // Clear chart instances before changing the DOM
        Object.keys(charts).forEach(key => {
            if (charts[key] && typeof charts[key].destroy === 'function') {
                try {
                    charts[key].destroy();
                } catch (err) {
                    console.error(`Error destroying chart ${key}:`, err);
                }
            }
        });
        charts = {}; // Reset the charts object
        
        // Load the analytics content
        const analyticsContent = await window.electronAPI.readFile('src/forms/analytics.html');
        document.getElementById('main-content').innerHTML = analyticsContent;

        const coins = await window.electronAPI.getAllCoins();
        await updateAnalyticsMetrics(coins);
        await initializeCharts();
    } catch (error) {
        console.error('Error in loadAnalysis:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to update analytics metrics
async function updateAnalyticsMetrics(coins) {
    try {
        const totalValue = coins.reduce((sum, coin) => sum + (coin.current_value || coin.value || 0), 0);
        const averageValue = totalValue / coins.length;
        const previousMonthValue = await calculatePreviousMonthValue(coins);
        const valueChange = totalValue - previousMonthValue;
        const percentageChange = (valueChange / previousMonthValue) * 100;

        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('average-value').textContent = `$${averageValue.toFixed(2)}`;
        document.getElementById('value-change').textContent = `$${valueChange.toFixed(2)}`;
        document.getElementById('percentage-change').textContent = `(${percentageChange.toFixed(1)}%)`;
        
        const indicator = document.getElementById('change-indicator');
        indicator.textContent = valueChange >= 0 ? '↑' : '↓';
        indicator.style.color = valueChange >= 0 ? 'var(--success-color)' : 'var(--error-color)';
    } catch (error) {
        console.error('Error updating analytics metrics:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to calculate previous month value
async function calculatePreviousMonthValue(coins) {
    const oneMonthAgo = dateFns.subMonths(new Date(), 1);
    return coins.reduce((sum, coin) => {
        const purchaseDate = new Date(coin.purchase_date);
        if (dateFns.isBefore(purchaseDate, oneMonthAgo)) {
            return sum + (coin.value || 0);
        }
        return sum;
    }, 0);
}

// Function to initialize charts
async function initializeCharts() {
    try {
        // Destroy all existing charts to prevent memory leaks
        Object.keys(charts).forEach(key => {
            if (charts[key] && typeof charts[key].destroy === 'function') {
                charts[key].destroy();
            }
        });
        
        // Clear the charts object
        charts = {};
        
        // Get all canvas elements
        const canvasElements = [
            document.getElementById('value-timeline-chart'),
            document.getElementById('geographic-distribution-chart'),
            document.getElementById('year-distribution-chart'),
            document.getElementById('collection-composition-chart')
        ];
        
        // Replace each canvas with a new one
        canvasElements.forEach(canvas => {
            if (canvas) {
                const parent = canvas.parentNode;
                if (parent) {
                    // Create a replacement canvas
                    const newCanvas = document.createElement('canvas');
                    newCanvas.id = canvas.id;
                    
                    // Replace the old canvas
                    parent.replaceChild(newCanvas, canvas);
                }
            }
        });
        
        // Now fetch the data and initialize charts
        const timelineData = await window.electronAPI.getValueTimeline();
        const geoData = await window.electronAPI.getGeographicDistribution();
        const yearData = await window.electronAPI.getYearDistribution();
        const compositionData = await window.electronAPI.getCollectionComposition();

        // Initialize each chart
        await initializeValueTimelineChart(timelineData);
        await initializeGeographicDistribution(geoData);
        await initializeYearDistribution(yearData);
        await initializeCollectionComposition(compositionData);
    } catch (error) {
        console.error('Error initializing charts:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to create dynamic canvas elements for chart
function createCanvasElement(parentId, chartId) {
    // Remove any existing canvas with this ID
    const existingCanvas = document.getElementById(chartId);
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Create new canvas element
    const canvas = document.createElement('canvas');
    canvas.id = chartId;
    
    // Append to parent
    const parent = document.getElementById(parentId);
    if (parent) {
        parent.innerHTML = ''; // Clear any existing content
        parent.appendChild(canvas);
        return canvas;
    }
    
    return null;
}

// Function to initialize value timeline chart
async function initializeValueTimelineChart(timelineData) {
    try {
        const container = document.querySelector('.chart-container:has(#value-timeline-chart)');
        if (container) {
            container.innerHTML = ''; // Clear existing content
            const canvas = document.createElement('canvas');
            canvas.id = 'value-timeline-chart';
            container.appendChild(canvas);
        }
        
        const ctx = document.getElementById('value-timeline-chart').getContext('2d');
        const processedData = await processCoinsForTimeline(timelineData);
        
        return createChart(ctx, {
            type: 'line',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Collection Value',
                    data: processedData.values,
                    borderColor: 'var(--accent-color)',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `$${value}`
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing value timeline chart:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to initialize geographic distribution chart
async function initializeGeographicDistribution(geoData) {
    try {
        const container = document.querySelector('.chart-container:has(#geographic-distribution-chart)');
        if (container) {
            container.innerHTML = ''; // Clear existing content
            const canvas = document.createElement('canvas');
            canvas.id = 'geographic-distribution-chart';
            container.appendChild(canvas);
        }
        
        const ctx = document.getElementById('geographic-distribution-chart').getContext('2d');
        const processedData = await processCountryData(geoData);
        const colors = generateColors(processedData.labels.length);
        
        return createChart(ctx, {
            type: 'pie',
            data: {
                labels: processedData.labels,
                datasets: [{
                    data: processedData.values,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing geographic distribution chart:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to initialize year distribution chart
async function initializeYearDistribution(yearData) {
    try {
        const container = document.querySelector('.chart-container:has(#year-distribution-chart)');
        if (container) {
            container.innerHTML = ''; // Clear existing content
            const canvas = document.createElement('canvas');
            canvas.id = 'year-distribution-chart';
            container.appendChild(canvas);
        }
        
        const ctx = document.getElementById('year-distribution-chart').getContext('2d');
        const processedData = await processYearData(yearData);
        
        return createChart(ctx, {
            type: 'bar',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Coins per Year',
                    data: processedData.values,
                    backgroundColor: 'rgba(74, 144, 226, 0.8)',
                    borderColor: 'rgba(74, 144, 226, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 'flex',
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: 'var(--text-color)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--text-color)'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-color)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing year distribution chart:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to initialize collection composition chart
async function initializeCollectionComposition(compositionData) {
    try {
        const container = document.querySelector('.chart-container:has(#collection-composition-chart)');
        if (container) {
            container.innerHTML = ''; // Clear existing content
            const canvas = document.createElement('canvas');
            canvas.id = 'collection-composition-chart';
            container.appendChild(canvas);
        }
        
        const ctx = document.getElementById('collection-composition-chart').getContext('2d');
        const processedData = await processTypeData(compositionData);
        const colors = generateColors(processedData.labels.length);
        
        return createChart(ctx, {
            type: 'doughnut',
            data: {
                labels: processedData.labels,
                datasets: [{
                    data: processedData.values,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing collection composition chart:', error);
        window.electronAPI.reportError(error);
    }
}

// Data processing functions
async function processCoinsForTimeline(timelineData) {
    // Filter out invalid dates first
    const validData = timelineData.filter(item => {
        const date = new Date(item.date);
        return !isNaN(date.getTime());
    });
    
    return {
        labels: validData.map(item => new Date(item.date)),
        values: validData.map(item => item.value)
    };
}

async function processCountryData(geoData) {
    return {
        labels: geoData.map(item => item.country || 'Unknown'),
        values: geoData.map(item => item.coin_count || 0)
    };
}

async function processYearData(yearData) {
    return {
        labels: yearData.map(item => item.year || 'Unknown'),
        values: yearData.map(item => item.coin_count || 0)
    };
}

async function processTypeData(typeData) {
    return {
        labels: typeData.map(item => item.type || 'Uncategorized'),
        values: typeData.map(item => item.count || 0)
    };
}

// Utility function to generate colors
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360) / count;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

// Settings functions
async function loadSettings() {
    currentView = 'settings'; // Set current view
    try {
        const settingsContent = await window.electronAPI.readFile('src/forms/settings.html');
        document.getElementById('main-content').innerHTML = settingsContent;

        const currentTheme = await window.electronAPI.getSetting(THEME_KEY);
        
        // Update the theme selector in settings page
        const themeSelector = document.querySelector('#settings #theme-selector');
        if (themeSelector) {
            themeSelector.value = currentTheme || LIGHT_THEME;
        }
        
        setupSettingsHandlers();
    } catch (error) {
        console.error('Error loading settings:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to set up settings page event handlers
function setupSettingsHandlers() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', async () => {
            const theme = themeSelector.value;
            await window.electronAPI.setSetting(THEME_KEY, theme);
            document.documentElement.setAttribute('data-theme', theme);
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await exportData();
        });
    }
    
    // Import button
    const importBtn = document.getElementById('import-data');
    const fileInput = document.getElementById('import-file');
    
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', async () => {
            if (fileInput.files.length > 0) {
                await importBackup(fileInput.files[0]);
            }
        });
    }
}

async function saveSettings() {
    try {
        const theme = document.getElementById('theme-selector').value;
        await window.electronAPI.setSetting(THEME_KEY, theme);
        await window.electronAPI.setTheme(theme);
        
        document.getElementById('settings-status').textContent = 'Settings saved successfully!';
    } catch (error) {
        console.error('Error saving settings:', error);
        window.electronAPI.reportError(error);
        document.getElementById('settings-status').textContent = 'Error saving settings';
    }
}

// Export function
async function exportData() {
    try {
        const format = document.getElementById('export-format').value;
        const exportedData = await window.electronAPI.exportCollection(format);
        
        const blob = new Blob([exportedData], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coin-collection.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting data:', error);
        window.electronAPI.reportError(error);
    }
}

// Import function
async function importBackup(file) {
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileData = event.target.result;
                
                // Update status
                const statusElement = document.getElementById('upload-status');
                if (statusElement) {
                    statusElement.textContent = 'Processing file...';
                }
                
                // Process file based on extension
                const fileName = file.name.toLowerCase();
                if (fileName.endsWith('.json') || fileName.endsWith('.csv')) {
                    // Display processing message
                    document.getElementById('upload-status').textContent = 'Importing data...';
                    
                    // Call the API to import the collection
                    // NOTE: Main process handles parsing now for validation
                    const result = await window.electronAPI.importCollection(fileData);
                    
                    // Show success message
                    document.getElementById('upload-status').textContent = `Data imported successfully! Processed ${result.count} records.`;
                    document.getElementById('upload-status').className = 'status-message success';
                    
                    // Reload dashboard after a short delay
                    setTimeout(() => loadDashboard(), 2000);
                } else {
                    throw new Error('Unsupported file format. Please use JSON or CSV files.');
                }
            } catch (error) {
                console.error('Error importing file:', error);
                window.electronAPI.reportError(error);
                
                // Show error message
                const statusElement = document.getElementById('upload-status');
                if (statusElement) {
                    statusElement.textContent = `Error: ${error.message}`;
                    statusElement.className = 'error-message'; // Corrected class name
                }
            }
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Error reading upload file:', error);
        window.electronAPI.reportError(error);
    }
}

// Theme initialization
async function initializeTheme() {
    try {
        const theme = await window.electronAPI.getSetting(THEME_KEY) || LIGHT_THEME;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update the theme toggle switch to match current theme
        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
            themeSwitch.checked = theme === DARK_THEME;
        }
        
        // Ensure theme is properly synced
        await window.electronAPI.setTheme(theme);
    } catch (error) {
        console.error('Error initializing theme:', error);
        window.electronAPI.reportError(error);
    }
}

// Action button setup
async function setupActionButtons() {
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', async () => {
            const coinId = button.getAttribute('data-coin-id');
            await showEditDialog(coinId);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', async () => {
            const coinId = button.getAttribute('data-coin-id');
            if (confirm('Are you sure you want to delete this coin?')) {
                try {
                    await window.electronAPI.deleteCoin(coinId);
                    await loadCollection();
                } catch (error) {
                    console.error('Error deleting coin:', error);
                    window.electronAPI.reportError(error);
                }
            }
        });
    });
}

// Function to display image in preview
function displayImageInPreview(preview, imageData) {
    if (!preview) return;
    
    // Find placeholder
    const placeholderElement = preview.querySelector('.preview-placeholder') || preview.querySelector('span');
    if (!placeholderElement) return;
    
    // Remove any existing image
    const existingImage = preview.querySelector('img');
    if (existingImage) {
        existingImage.remove();
    }
    
    // Reset class and show placeholder if no image
    if (!imageData) {
        preview.classList.remove('has-image');
        placeholderElement.style.display = 'block';
        return;
    }
    
    // Create and append image
    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.src = imageData;
    
    // Hide placeholder and show image
    placeholderElement.style.display = 'none';
    preview.appendChild(img);
    preview.classList.add('has-image');
}

// Function to show edit dialog
async function showEditDialog(coinId) {
    try {
        const coin = await window.electronAPI.getCoinById(coinId);
        if (!coin) {
            throw new Error('Coin not found');
        }

        let editModal = document.getElementById('edit-coin-modal');
        let isNewModal = false;

        // Load modal HTML if it doesn't exist
        if (!editModal) {
            isNewModal = true; // Flag that we loaded new HTML
            editModal = document.createElement('div');
            editModal.id = 'edit-coin-modal';
            editModal.className = 'modal-overlay';
            const editFormContent = await window.electronAPI.readFile('src/forms/edit-coin.html');
            editModal.innerHTML = editFormContent;
            const dialogContainer = document.getElementById('dialog-container') || document.body;
            dialogContainer.appendChild(editModal);
            console.log('Edit modal element created and HTML loaded.');
        }
        
        const form = document.getElementById('edit-coin-form');
        if (!form) {
             console.error('Edit form element (#edit-coin-form) not found in the DOM.');
             // Attempt to find it again after a small delay if it was newly added
             await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
             form = document.getElementById('edit-coin-form');
             if (!form) {
                 throw new Error('Edit form element (#edit-coin-form) still not found after delay.');
             }
        }
        
        // Use requestAnimationFrame to wait for DOM updates after innerHTML
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // --- Form Initialization (Runs after two animation frames) --- 
                let editFormInstance = null;
                try {
                    // Instantiate EditCoinForm
                    editFormInstance = new EditCoinForm(); 
                    editModal.formInstance = editFormInstance; // Store instance on the modal
                    console.log('EditCoinForm instance created (after rAF).');

                    // Explicitly check for elements in the global scope *before* initializing
                    console.log('Checking elements globally before init:', {
                        form: !!document.getElementById('edit-coin-form'),
                        obvPreview: !!document.getElementById('edit-obverse-preview'),
                        obvInput: !!document.getElementById('edit-obverse-image'),
                        revPreview: !!document.getElementById('edit-reverse-preview'),
                        revInput: !!document.getElementById('edit-reverse-image')
                    });
                    
                    // Initialize elements and listeners AFTER instantiation, passing the modal element
                    editFormInstance.initializeElementsAndListeners(editModal);
                    
                    // Check if initialization failed (elements not found - check form as basic guard)
                    if (!editFormInstance.form) {
                        console.error('Form initialization failed - elements likely not found by initializeElementsAndListeners within modal.');
                        // Log modal structure if init failed
                        console.log('Modal element structure at init failure:', editModal.outerHTML);
                        editModal.style.display = 'none';
                        return; 
                    }
                    console.log('EditCoinForm initializeElementsAndListeners called successfully.'); // Changed log message
                    
                    // Populate form fields (using direct value setting or instance method)
                    // Using direct seems safer given init issues, but could use instance:
                    // editFormInstance.populateForm(coin);
                    Object.keys(coin).forEach(key => {
                        // Use editFormInstance.form which was queried within the modal
                        const input = editFormInstance.form.querySelector(`[name="${key}"]`); 
                        if (input) {
                            if (input.type === 'date' && coin[key]) {
                                try { input.value = new Date(coin[key]).toISOString().split('T')[0]; } catch (e) { input.value = ''; }
                            } else {
                                input.value = coin[key] ?? '';
                            }
                        }
                    });

                    // Display images (using instance properties)
                    displayImageInPreview(editFormInstance.obversePreview, coin.obverse_image);
                    displayImageInPreview(editFormInstance.reversePreview, coin.reverse_image);

                    // Setup form submission 
                    editFormInstance.form.onsubmit = async (e) => { // Use instance's form reference
                       // ... (submit logic remains largely the same, using instance properties for inputs) ...
                        e.preventDefault();
                        const obverseInput = editFormInstance.obverseInput;
                        const reverseInput = editFormInstance.reverseInput;
                        try {
                            const formData = new FormData(editFormInstance.form);
                            const updatedCoin = {};
                            formData.forEach((value, key) => {
                                if (key !== 'obverse_image' && key !== 'reverse_image') {
                                    updatedCoin[key] = value;
                                }
                            });
                            if (obverseInput && obverseInput.files.length > 0) {
                                updatedCoin.obverse_image = await readFileAsBase64(obverseInput.files[0]);
                            } else {
                                updatedCoin.obverse_image = coin.obverse_image; 
                            }
                            if (reverseInput && reverseInput.files.length > 0) {
                                updatedCoin.reverse_image = await readFileAsBase64(reverseInput.files[0]);
                            } else {
                                updatedCoin.reverse_image = coin.reverse_image; 
                            }
                            await window.electronAPI.updateCoin(coinId, updatedCoin);
                            editModal.style.display = 'none';
                            document.body.style.overflow = '';
                            await loadCollection();
                        } catch (error) {
                            console.error('Error updating coin:', error);
                            window.electronAPI.reportError(error);
                        }
                    };

                    // Setup close/cancel actions
                    const closeButton = editModal.querySelector('.close-button');
                    const cancelButton = editModal.querySelector('#cancel-edit') || editModal.querySelector('.secondary-button');
                    const closeDialog = () => {
                        // ... (close dialog logic remains the same, using editFormInstance) ...
                        editModal.style.display = 'none';
                        document.body.style.overflow = '';
                        if (editFormInstance && typeof editFormInstance.clearForm === 'function') {
                            editFormInstance.clearForm();
                        } else {
                            console.warn('Could not find form instance or clearForm method on close.');
                            if(editFormInstance.form) editFormInstance.form.reset(); // Use instance form
                             displayImageInPreview(editFormInstance.obversePreview, null); // Use instance previews
                             displayImageInPreview(editFormInstance.reversePreview, null);
                        }
                    };
                    if (closeButton) closeButton.onclick = closeDialog;
                    if (cancelButton) cancelButton.onclick = closeDialog;

                    // Show the modal now that it's ready
                    editModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';

                } catch (err) {
                    console.error('Error during form initialization (post-rAF):', err);
                    window.electronAPI.reportError(err);
                    if (editModal) editModal.style.display = 'none'; 
                }
                // --- End Form Initialization ---
            }); // End inner rAF
        }); // End outer rAF

    } catch (error) {
        console.error('Error showing edit dialog (outer try/catch): ', error);
        window.electronAPI.reportError(error);
    }
}

// Helper function to read a file as base64
function readFileAsBase64(file) {
    console.log('Reading file as base64:', file.name, file.type, file.size);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            console.log('File read successful, data length:', event.target.result.length);
            resolve(event.target.result);
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file as base64:', error);
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Event Listeners
window.electronAPI.on('theme-changed', (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
});

window.electronAPI.on('collection-updated', async () => {
    if (document.querySelector('#collection-table')) {
        await loadCollection();
    } else if (document.querySelector('#dashboard')) {
        await loadDashboard();
    }
});

// Function to load the upload collection view
async function loadUploadCollection() {
    currentView = 'upload'; // Set current view
    try {
        console.log('Loading upload collection view');
        
        const uploadContentHTML = await window.electronAPI.readFile('src/forms/upload_collection.html');
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = uploadContentHTML;
        
        // Get references AFTER loading HTML
        const uploadForm = mainContent.querySelector('.upload-collection-form'); // Container for dynamic layout
        const uploadSection = mainContent.querySelector('.upload-section'); // The initial content
        const uploadBox = document.getElementById('upload-box');
        const fileInput = document.getElementById('file-upload');
        const fileInfo = document.getElementById('file-info');
        const fileNameEl = document.getElementById('file-name'); 
        const importBtn = document.getElementById('import-button'); // In file-info initially
        const cancelBtn = document.getElementById('cancel-upload'); // In file-info initially
        const statusEl = document.getElementById('upload-status');

        // --- Event Listeners Setup --- 
        if (!uploadForm || !uploadSection || !uploadBox || !fileInput || !fileInfo || !fileNameEl || !importBtn || !cancelBtn || !statusEl) {
            console.error('One or more elements missing in upload_collection.html');
            mainContent.innerHTML = '<p class="error-message">Error loading upload UI components.</p>';
            return; // Stop execution if essential elements are missing
        }

        if (uploadBox) {
            uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('drag-over'); });
            uploadBox.addEventListener('dragleave', () => { uploadBox.classList.remove('drag-over'); });
            uploadBox.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadBox.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    handleSelectedFile(e.dataTransfer.files[0]);
                }
            });
            // Click listener refined to prevent double trigger
            uploadBox.addEventListener('click', (e) => {
                if (!e.target.closest('.upload-button')) { 
                    fileInput?.click(); 
                }
            });
            const chooseFileButton = uploadBox.querySelector('.upload-button');
            if (chooseFileButton) {
                chooseFileButton.addEventListener('click', (e) => { e.stopPropagation(); });
            }
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    handleSelectedFile(e.target.files[0]);
                }
            });
        }

        // Cancel button in the initial file-info section
        // This button is reused by the mapping UI cancel action via resetUploadView
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                resetUploadView(); 
            });
        }

        // Import button in the initial file-info section (for non-CSV)
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                if (fileInput.files.length > 0) {
                   // This button is now only for non-CSV direct imports
                   // We use importCollectionFile directly here as it handles non-mapping imports
                   await importCollectionFile(fileInput.files[0]); 
                }
            });
        }

        // --- handleSelectedFile Function (Modified for Dynamic UI) --- 
        async function handleSelectedFile(file) {
            // 1. Reset UI to initial state first
            resetUploadView(); 
            
            // 2. Validate file type
            const validTypes = ['.csv', '.json']; // Removed .xlsx for now
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            
            if (!validTypes.includes(fileExt)) {
                statusEl.textContent = 'Invalid file type. Please select a CSV or JSON file.';
                statusEl.className = 'status-message error';
                fileInput.value = ''; // Clear the invalid selection
                return;
            }

            // 3. Display basic file info
            fileNameEl.textContent = file.name;
            fileInfo.style.display = 'flex';
            statusEl.textContent = ''; 
            statusEl.className = 'status-message';

            // 4. Handle based on type
            if (fileExt === '.csv') {
                console.log('CSV file detected, preparing mapping UI...');
                // Hide the direct import button, show cancel
                importBtn.style.display = 'none'; 
                cancelBtn.style.display = 'inline-block';
                cancelBtn.textContent = 'Cancel Upload'; // Explicitly set text

                // 5. Dynamically restructure layout for mapping
                if (uploadForm && uploadSection) {
                    const h2Title = uploadForm.querySelector('h2'); // Find the H2 title
                    
                    uploadForm.classList.add('two-column'); 

                    // Create left column wrapper if needed
                    let leftCol = uploadForm.querySelector('.upload-content-original');
                    if (!leftCol) {
                        leftCol = document.createElement('div');
                        leftCol.className = 'upload-content-original';
                        // Insert wrapper before the H2 (or first element if H2 is missing)
                        uploadForm.insertBefore(leftCol, h2Title || uploadForm.firstChild); 
                        // Move H2 and upload section into the wrapper
                        if (h2Title) leftCol.appendChild(h2Title); 
                        leftCol.appendChild(uploadSection); 
                    } else {
                         leftCol.style.display = 'block'; // Ensure visible if reset previously
                    }
                    
                    // Create/clear right column for mapping
                    let rightCol = uploadForm.querySelector('.upload-mapping-area');
                    if (!rightCol) {
                        rightCol = document.createElement('div');
                        rightCol.className = 'upload-mapping-area';
                        uploadForm.appendChild(rightCol);
                    } else {
                        rightCol.innerHTML = ''; // Clear previous mapping UI
                        rightCol.style.display = 'block'; // Ensure visible
                    }
                    
                    // 6. Load mapping UI & Parse Headers
                    statusEl.textContent = 'Loading mapping interface...';
                    statusEl.className = 'status-message processing';
                    try {
                        const mappingHTML = await window.electronAPI.readFile('src/forms/upload_mapping_section.html');
                        rightCol.innerHTML = mappingHTML;
                        
                        statusEl.textContent = 'Reading CSV headers...';
                        Papa.parse(file, {
                            header: false, // Parse rows as arrays, not objects yet
                            skipEmptyLines: true,
                            complete: function(results) {
                                console.log('PapaParse header results:', results); // Log the results
                                
                                if (results.errors && results.errors.length > 0) {
                                    console.error('PapaParse header parsing errors:', results.errors);
                                    throw new Error(`Error parsing CSV headers: ${results.errors[0].message}`);
                                }

                                // Get headers from the first row of data
                                const headers = results.data?.[0]; 
                                
                                // Validate the extracted headers
                                if (Array.isArray(headers) && headers.length > 0 && headers.some(h => h && String(h).trim() !== '')) {
                                    // Ensure headers are strings
                                    const stringHeaders = headers.map(h => String(h).trim()); 
                                    statusEl.textContent = ''; 
                                    statusEl.className = '';
                                    displayMappingUI(stringHeaders, file); // Pass validated string headers
                                } else {
                                    console.error('No valid headers found in the first row of the CSV.', results.data);
                                    throw new Error('Could not parse CSV headers. Check file format, encoding, and ensure a non-empty header row exists.');
                                }
                            },
                            error: function(error) { // Renamed variable
                                console.error('Error during PapaParse header reading execution:', error);
                                throw new Error(`Error reading CSV headers: ${error.message}`);
                            }
                        });
                    } catch(err) {
                        console.error('Error loading or processing mapping UI:', err);
                        statusEl.textContent = `Error setting up mapping: ${err.message}`;
                        statusEl.className = 'status-message error';
                        resetUploadView(); // Reset on error
                    }
                } else {
                     console.error('Cannot find uploadForm or uploadSection to modify layout.');
                }
            } else {
                // Handle non-CSV (e.g., JSON) - show direct import controls
                console.log('Non-CSV file detected, enabling direct import.');
                importBtn.style.display = 'inline-block'; // Show direct import button
                importBtn.disabled = false;
                cancelBtn.style.display = 'inline-block'; // Ensure cancel is visible
                cancelBtn.textContent = 'Cancel';
                 
                // Ensure mapping area is hidden if it exists from a previous CSV attempt
                 const mappingArea = uploadForm.querySelector('.upload-mapping-area');
                 if(mappingArea) mappingArea.style.display = 'none';
            }
        } // End handleSelectedFile
        
        await initializeTheme();

    } catch (error) {
       console.error('Error in loadUploadCollection:', error);
       window.electronAPI.reportError(error);
       document.getElementById('main-content').innerHTML = `
           <div class="error-message">
               <h3>Error Loading Upload View</h3>
               <p>${error.message}</p>
           </div>
       `;
    }
}

// Function to handle file import
async function importCollectionFile(file) {
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileData = event.target.result;
                
                // Update status
                const statusElement = document.getElementById('upload-status');
                if (statusElement) {
                    statusElement.textContent = 'Processing file...';
                }
                
                // Process file based on extension
                const fileName = file.name.toLowerCase();
                if (fileName.endsWith('.json') || fileName.endsWith('.csv')) {
                    // Display processing message
                    document.getElementById('upload-status').textContent = 'Importing data...';
                    
                    // Call the API to import the collection
                    // NOTE: Main process handles parsing now for validation
                    const result = await window.electronAPI.importCollection(fileData);
                    
                    // Show success message
                    document.getElementById('upload-status').textContent = `Data imported successfully! Processed ${result.count} records.`;
                    document.getElementById('upload-status').className = 'status-message success';
                    
                    // Reload dashboard after a short delay
                    setTimeout(() => loadDashboard(), 2000);
                } else {
                    throw new Error('Unsupported file format. Please use JSON or CSV files.');
                }
            } catch (error) {
                console.error('Error importing file:', error);
                window.electronAPI.reportError(error);
                
                // Show error message
                const statusElement = document.getElementById('upload-status');
                if (statusElement) {
                    statusElement.textContent = `Error: ${error.message}`;
                    statusElement.className = 'error-message'; // Corrected class name
                }
            }
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Error reading upload file:', error);
        window.electronAPI.reportError(error);
    }
}

// Helper to read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

const DB_COLUMNS = [
    { value: 'title', text: 'Title (Required)', required: true },
    { value: 'year', text: 'Year (Required)', required: true },
    { value: 'country', text: 'Country (Required)', required: true },
    { value: 'value', text: 'Value', required: false },
    { value: 'unit', text: 'Unit', required: false },
    { value: 'mint', text: 'Mint', required: false },
    { value: 'mint_mark', text: 'Mint Mark', required: false },
    { value: 'status', text: 'Status', required: false },
    { value: 'type', text: 'Type', required: false },
    { value: 'series', text: 'Series', required: false },
    { value: 'format', text: 'Format', required: false },
    { value: 'region', text: 'Region', required: false },
    { value: 'storage', text: 'Storage', required: false },
    { value: 'quantity', text: 'Quantity', required: false },
    { value: 'purchase_price', text: 'Purchase Price', required: false },
    { value: 'purchase_date', text: 'Purchase Date', required: false },
    // Add others like notes, condition, etc. if they exist in your DB schema
];

async function displayMappingUI(headers, file) {
    console.log("Displaying mapping UI for headers:", headers);
    const mappingArea = document.querySelector('.upload-mapping-area');
    if (!mappingArea) {
        console.error('Mapping area not found in the DOM.');
        return;
    }

    // Find the specific container for rows *within* the mapping area
    const rowsContainer = mappingArea.querySelector('#mapping-rows-container');
    if (!rowsContainer) {
        console.error('Mapping rows container (#mapping-rows-container) not found within the mapping area.');
        return;
    }
    rowsContainer.innerHTML = ''; // Clear previous rows from the container

    const dbFields = ["Don't Import", 'title', 'year', 'value', 'grade', 'currency', 'country', 'composition', 'weight', 'diameter', 'thickness', 'obverse_description', 'reverse_description', 'notes', 'serial_number', 'purchase_date', 'purchase_price', 'quantity']; // Added Quantity
    const requiredDbFields = ['title', 'year', 'country'];

    // Fuzzy matching setup
    const options = {
        includeScore: true,
        threshold: 0.4, // Adjust threshold for stricter/looser matching
        keys: ['name'] // Assuming dbFields are just strings
    };
    const fuse = new Fuse(dbFields.map(name => ({ name })), options);

    headers.forEach(header => {
        const mappingRow = document.createElement('div');
        mappingRow.className = 'mapping-row';

        const headerLabel = document.createElement('span');
        headerLabel.className = 'csv-header';
        headerLabel.textContent = header;
        headerLabel.title = header; // Tooltip for long headers

        const select = document.createElement('select');
        select.dataset.csvHeader = header;

        // Pre-selection logic using fuzzy matching
        let bestMatch = "Don't Import";
        const results = fuse.search(header);
        if (results.length > 0) {
            // Basic check for common ignore patterns
            const lowerHeader = header.toLowerCase();
            if (!lowerHeader.includes('image') && !lowerHeader.includes('photo') && !lowerHeader.includes('picture')) {
                bestMatch = results[0].item.name;
            }
        }

        dbFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format for display
            if (field === bestMatch) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        mappingRow.appendChild(headerLabel);
        mappingRow.appendChild(select);
        
        // Append the row to the dedicated container
        rowsContainer.appendChild(mappingRow);
    });

    // Add event listeners for the buttons within the mapping area
    const confirmBtn = mappingArea.querySelector('#confirm-mapping-btn');
    const cancelMapBtn = mappingArea.querySelector('#cancel-mapping-btn');
    const mappingStatus = mappingArea.querySelector('#mapping-status');

    if (confirmBtn) {
        confirmBtn.onclick = () => handleConfirmMapping(file, mappingStatus);
        confirmBtn.disabled = false; // Ensure enabled
    } else {
        console.error('Confirm mapping button (#confirm-mapping-btn) not found');
    }
    
    if (cancelMapBtn) {
        cancelMapBtn.onclick = handleCancelMapping;
    } else {
        console.error('Cancel mapping button (#cancel-mapping-btn) not found');
    }
}

async function handleConfirmMapping(file, mappingStatus) {
    console.log('Confirm mapping clicked for file:', file.name);
    const mappingArea = document.querySelector('.upload-mapping-area');
    const statusEl = mappingArea?.querySelector('#mapping-status');
    const confirmBtn = mappingArea?.querySelector('#confirm-mapping-btn');
    const cancelBtn = mappingArea?.querySelector('#cancel-mapping-btn');

    if (!mappingArea || !statusEl || !confirmBtn || !cancelBtn) {
        console.error('Cannot confirm mapping, UI elements missing (confirmBtn, cancelBtn, statusEl).');
        // Add more specific logging if needed:
        console.error(`Debug: mappingArea=${!!mappingArea}, statusEl=${!!statusEl}, confirmBtn=${!!confirmBtn}, cancelBtn=${!!cancelBtn}`);
        return;
    }

    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    statusEl.textContent = 'Validating mapping...';
    statusEl.className = 'status-message processing';

    // --- 1. Read mapping from UI --- 
    const mapping = {};
    const selects = mappingArea.querySelectorAll('#mapping-rows-container select');
    let isValidMapping = true;
    const mappedDbFields = new Set();
    const requiredFieldsMapped = new Set();

    selects.forEach(select => {
        const csvHeader = select.dataset.csvHeader;
        const dbField = select.value;

        if (dbField !== '-- Select --' && dbField !== '-- Ignore --') {
            mapping[csvHeader] = dbField;
            if (mappedDbFields.has(dbField)) {
                statusEl.textContent = `Error: Database field '${dbField}' is mapped multiple times.`;
                isValidMapping = false;
            }
            mappedDbFields.add(dbField);
            const requiredCol = DB_COLUMNS.find(c => c.value === dbField && c.required);
            if (requiredCol) {
                requiredFieldsMapped.add(dbField);
            }
        } else {
             mapping[csvHeader] = null; // Mark as not mapped or ignored
        }
    });

    // --- 2. Validate Mapping --- 
    const missingRequired = DB_COLUMNS.filter(c => c.required && !requiredFieldsMapped.has(c.value));
    if (missingRequired.length > 0) {
        const missingNames = missingRequired.map(c => c.text.replace(' (Required)','')).join(', ');
        statusEl.textContent = `Error: Required database fields not mapped: ${missingNames}.`;
        isValidMapping = false;
    }

    if (!isValidMapping) {
        statusEl.className = 'status-message error';
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        return;
    }
    
    // --- 3. Read full file & Parse --- 
    statusEl.textContent = 'Reading and parsing file...';
    try {
        const fileContent = await readFileAsText(file);
        
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: async function(results) {
                if (results.errors.length > 0) {
                    console.warn('CSV Parsing warnings/errors (full file):', results.errors);
                    // Depending on severity, might want to stop here
                    // For now, we proceed but the main process validation might catch issues
                }
                
                const originalData = results.data;
                if (!originalData || originalData.length === 0) {
                     throw new Error('No data rows found in the CSV file after parsing headers.');
                }
                console.log(`Parsed full CSV: ${originalData.length} data rows.`);

                // --- 4. Transform Data based on Mapping --- 
                statusEl.textContent = 'Transforming data based on mapping...';
                const transformedData = [];
                originalData.forEach((row, index) => {
                    const newCoin = {};
                    let skipRow = false;
                    for (const csvHeader in mapping) {
                        const dbField = mapping[csvHeader];
                        if (dbField) { // Only process mapped fields
                           // Trim whitespace from incoming data
                           const rawValue = row[csvHeader] !== undefined && row[csvHeader] !== null ? String(row[csvHeader]).trim() : null;
                           newCoin[dbField] = rawValue; 
                        }
                    }
                    // Add timestamp (optional, main process might do this)
                    newCoin.created_at = new Date().toISOString(); 
                    transformedData.push(newCoin);
                });

                if (transformedData.length === 0) {
                   throw new Error('No data rows were processed after mapping.');
                }

                // --- 5. Send Transformed Data to Main Process --- 
                statusEl.textContent = `Importing ${transformedData.length} records...`;
                const jsonData = JSON.stringify(transformedData);
                try {
                    // Call main process (which now expects pre-mapped JSON string)
                    const result = await window.electronAPI.importCollection(jsonData);
                    console.log('Import result from main process:', result);
                    
                    if (result.success) {
                        statusEl.textContent = `Successfully imported ${result.count} coins!`;
                        statusEl.className = 'status-message success';
                        setTimeout(resetUploadView, 2500); // Reset view after success message
                    } else {
                        // Error came from main process validation/DB insert
                        throw new Error(result.error || 'Unknown error during database import.');
                    }
                } catch (ipcError) {
                    // Error related to the IPC call itself or re-thrown from main
                    console.error('Error calling/handling importCollection IPC:', ipcError);
                    throw new Error(`Import Failed: ${ipcError.message}`); 
                }
            },
            error: function(error) {
                 // Error during PapaParse itself
                 console.error('Error parsing full CSV file:', error);
                 throw new Error(`Error reading CSV file data: ${error.message}`);
            }
        });
    } catch (error) {
        // Catch errors from file reading, parsing setup, or thrown from callbacks
        console.error('Error in handleConfirmMapping:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.className = 'status-message error';
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
    }
}

function handleCancelMapping() {
    console.log('Cancel mapping clicked');
    resetUploadView();
}

function resetUploadView() {
    console.log('Resetting upload view to initial state.');
    
    const uploadForm = document.querySelector('.upload-collection-form');
    const uploadSection = uploadForm?.querySelector('.upload-section'); // Original content container
    const leftCol = uploadForm?.querySelector('.upload-content-original');
    const rightCol = uploadForm?.querySelector('.upload-mapping-area');
    const fileInput = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const fileNameEl = document.getElementById('file-name'); 
    const importBtn = document.getElementById('import-button');
    const cancelBtn = document.getElementById('cancel-upload');
    const statusEl = document.getElementById('upload-status'); // Main status
    const mappingStatusEl = rightCol?.querySelector('#mapping-status'); // Status in mapping area

    const h2Title = leftCol?.querySelector('h2'); // Find H2 within leftCol before removing

    // 1. Remove dynamic layout classes and elements
    if (uploadForm) {
        uploadForm.classList.remove('two-column');
    }
    if (rightCol) {
        rightCol.remove(); // Remove the mapping area completely
    }
    if (leftCol && uploadSection) {
        // Move H2 and uploadSection back out before removing leftCol
        if (h2Title) uploadForm.insertBefore(h2Title, leftCol);
        uploadForm.insertBefore(uploadSection, leftCol); 
        leftCol.remove(); // Remove the wrapper div
    }

    // 2. Reset file input and related UI
    if (fileInput) {
        fileInput.value = ''; // Clear selected file
    }
    if (fileInfo) {
        fileInfo.style.display = 'none'; // Hide file info display
    }
    if (fileNameEl) {
        fileNameEl.textContent = '';
    }
    if (importBtn) {
        importBtn.style.display = 'inline-block'; // Ensure direct import button is visible by default
        importBtn.disabled = true; // Disabled until a file is selected
    }
     if (cancelBtn) {
        cancelBtn.style.display = 'inline-block'; // Ensure cancel button is visible
        cancelBtn.textContent = 'Cancel'; // Reset button text
    }
    if (statusEl) {
        statusEl.textContent = ''; // Clear main status message
        statusEl.className = 'status-message';
    }
    // No need to clear mappingStatusEl as its parent (rightCol) is removed
}

// Simple Levenshtein distance function (for fuzzy matching)
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length; 
    if (b.length === 0) return a.length; 
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

// Function to load the add coin form
async function loadAddCoin() {
    // Don't set currentView here, as it's a temporary form page
    try {
        console.log('Loading add coin form');
        
        const addCoinContent = await window.electronAPI.readFile('src/forms/add_coin_form.html');
        document.getElementById('main-content').innerHTML = addCoinContent;
        
        // Set today's date
        const dateCollectedInput = document.getElementById('date-collected');
        if (dateCollectedInput) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            dateCollectedInput.value = formattedDate;
        }
        
        // Set up country search
        setupCountrySearch();
        
        // Setup image upload previews
        setupImageUploadPreviews();
        
        // Add event listeners for form actions
        const coinForm = document.getElementById('coin-form');
        const cancelButton = document.getElementById('cancel-add');
        
        if (coinForm) {
            coinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveCoin();
            });
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                console.log('Cancel add coin clicked');
                navigateBack('collection');
            });
        }
        
        await initializeTheme();
    } catch (error) {
        console.error('Error in loadAddCoin:', error);
        window.electronAPI.reportError(error);
        document.getElementById('main-content').innerHTML = `
            <div class="error-message">
                <h3>Error Loading Add Coin Form</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Function to set up country search
function setupCountrySearch() {
    const countrySearch = document.getElementById('country-search');
    const countryOptions = document.getElementById('country-options');
    const countryInput = document.getElementById('country');
    
    if (!countrySearch || !countryOptions || !countryInput) return;
    
    // List of countries (abbreviated list)
    const countries = [
        'United States', 'Canada', 'Mexico', 'United Kingdom', 'France', 'Germany', 
        'Italy', 'Spain', 'Japan', 'China', 'Australia', 'Brazil', 'India', 'Russia',
        'South Africa', 'Argentina', 'Egypt', 'Greece', 'Israel', 'Netherlands',
        'Poland', 'Portugal', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine',
        'Vietnam', 'Thailand', 'Singapore', 'Philippines', 'New Zealand', 'Malaysia',
        'South Korea', 'North Korea', 'Indonesia', 'Ireland', 'Iceland', 'Denmark',
        'Norway', 'Finland', 'Belgium', 'Austria', 'Czech Republic', 'Hungary'
    ];
    
    // Populate the options
    countries.sort().forEach(country => {
        const option = document.createElement('div');
        option.className = 'select-option';
        option.textContent = country;
        option.addEventListener('click', () => {
            countryInput.value = country;
            countrySearch.value = country;
            countryOptions.classList.remove('visible');
        });
        countryOptions.appendChild(option);
    });
    
    // Show options on focus
    countrySearch.addEventListener('focus', () => {
        countryOptions.classList.add('visible');
    });
    
    // Filter options when typing
    countrySearch.addEventListener('input', () => {
        const searchTerm = countrySearch.value.toLowerCase();
        Array.from(countryOptions.children).forEach(option => {
            const optionText = option.textContent.toLowerCase();
            option.style.display = optionText.includes(searchTerm) ? 'block' : 'none';
        });
    });
    
    // Hide options when clicking outside
    document.addEventListener('click', (e) => {
        if (!countrySearch.contains(e.target) && !countryOptions.contains(e.target)) {
            countryOptions.classList.remove('visible');
        }
    });
}

// Function to setup image upload previews
function setupImageUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) {
        console.error(`Could not find elements: input=${inputId}, preview=${previewId}`);
        return;
    }

    // Check if listeners are already attached
    if (preview.dataset.imageUploadInitialized === 'true') {
        console.log(`Image upload already initialized for ${previewId}`);
        return; // Don't attach listeners again
    }
    
    console.log(`Setting up image upload for ${inputId}`);
    
    const placeholderElement = preview.querySelector('.preview-placeholder') || preview.querySelector('span');
    
    if (!placeholderElement) {
        console.error(`Could not find placeholder in preview element: ${previewId}`);
        return;
    }
    
    // Preview when clicking on the preview area
    preview.addEventListener('click', () => {
        console.log(`Preview clicked for ${inputId}`);
        input.click();
    });
    
    // Update preview when file is selected
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log(`File selected for ${inputId}:`, file.name);
        
        const existingImage = preview.querySelector('img');
        if (existingImage) {
            existingImage.remove();
        }
        
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        
        placeholderElement.style.display = 'none';
        
        const reader = new FileReader();
        reader.onload = (event) => {
            img.src = event.target.result;
            preview.appendChild(img);
            preview.classList.add('has-image');
            console.log(`Image preview updated for ${inputId}`);
        };
        
        reader.onerror = (error) => {
            console.error(`Error reading file:`, error);
            placeholderElement.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    });

    // Mark as initialized
    preview.dataset.imageUploadInitialized = 'true';
}

// Function to setup image upload previews for add coin form
function setupImageUploadPreviews() {
    // For Add Coin form
    const addFormObverseInput = document.getElementById('obverse-image');
    const addFormReverseInput = document.getElementById('reverse-image');
    
    if (addFormObverseInput && addFormReverseInput) {
        setupImageUpload('obverse-image', 'obverse-preview');
        setupImageUpload('reverse-image', 'reverse-preview');
    }
}

// Function to save the coin data
async function saveCoin() {
    try {
        const form = document.getElementById('coin-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const coinData = {};
        
        // Convert FormData to object
        formData.forEach((value, key) => {
            if (key !== 'obverse_image' && key !== 'reverse_image') {
                coinData[key] = value;
            }
        });
        
        // Handle images (convert to base64 if needed)
        const obverseImageInput = document.getElementById('obverse-image');
        const reverseImageInput = document.getElementById('reverse-image');
        
        if (obverseImageInput && obverseImageInput.files.length > 0) {
            try {
                console.log(`Processing obverse image: ${obverseImageInput.files[0].name}`);
                coinData.obverse_image = await readFileAsBase64(obverseImageInput.files[0]);
            } catch (error) {
                console.error('Error processing obverse image:', error);
            }
        }
        
        if (reverseImageInput && reverseImageInput.files.length > 0) {
            try {
                console.log(`Processing reverse image: ${reverseImageInput.files[0].name}`);
                coinData.reverse_image = await readFileAsBase64(reverseImageInput.files[0]);
            } catch (error) {
                console.error('Error processing reverse image:', error);
            }
        }
        
        // Add current timestamp
        coinData.created_at = new Date().toISOString();
        
        console.log('Saving coin data', {
            hasObverse: !!coinData.obverse_image,
            hasReverse: !!coinData.reverse_image,
            dataKeys: Object.keys(coinData)
        });
        
        // Save the coin via the Electron API
        await window.electronAPI.addCoin(coinData);
        
        // Navigate back to the previous page or collection page
        navigateBack('collection');
    } catch (error) {
        console.error('Error saving coin:', error);
        window.electronAPI.reportError(error);
        alert('Error saving coin: ' + error.message);
    }
}