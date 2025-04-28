// Theme Constants
const THEME_KEY = 'app-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

// Global variables
let worldMap = null;
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

// Function to load the dashboard
async function loadDashboard() {
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
                    await window.electronAPI.importCollection(fileData);
                    
                    // Show success message
                    document.getElementById('upload-status').textContent = 'Data imported successfully!';
                    document.getElementById('upload-status').className = 'success-message';
                    
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
                    statusElement.className = 'error-message';
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
    try {
        console.log('Loading upload collection view');
        
        const uploadContent = await window.electronAPI.readFile('src/forms/upload_collection.html');
        document.getElementById('main-content').innerHTML = uploadContent;
        
        // Set up drag and drop functionality
        const uploadBox = document.getElementById('upload-box');
        const fileInput = document.getElementById('file-upload');
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const importBtn = document.getElementById('import-button');
        const cancelBtn = document.getElementById('cancel-upload');
        const statusEl = document.getElementById('upload-status');
        
        // Drag and drop events
        if (uploadBox) {
            uploadBox.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadBox.classList.add('drag-over');
            });
            
            uploadBox.addEventListener('dragleave', () => {
                uploadBox.classList.remove('drag-over');
            });
            
            uploadBox.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadBox.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length) {
                    handleSelectedFile(e.dataTransfer.files[0]);
                }
            });
            
            // Click to upload
            uploadBox.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }
        
        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    handleSelectedFile(e.target.files[0]);
                }
            });
        }
        
        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                fileInput.value = '';
                fileInfo.style.display = 'none';
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            });
        }
        
        // Import button
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                if (fileInput.files.length > 0) {
                    await importCollectionFile(fileInput.files[0]);
                }
            });
        }
        
        // Function to handle selected file
        function handleSelectedFile(file) {
            const validTypes = ['.csv', '.json', '.xlsx'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            
            if (validTypes.includes(fileExt)) {
                fileName.textContent = file.name;
                fileInfo.style.display = 'flex';
                importBtn.disabled = false;
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            } else {
                statusEl.textContent = 'Invalid file type. Please select a CSV, JSON, or Excel file.';
                statusEl.className = 'status-message error';
                fileInput.value = '';
            }
        }
        
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
                    await window.electronAPI.importCollection(fileData);
                    
                    // Show success message
                    document.getElementById('upload-status').textContent = 'Data imported successfully!';
                    document.getElementById('upload-status').className = 'success-message';
                    
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
                    statusElement.className = 'error-message';
                }
            }
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Error reading upload file:', error);
        window.electronAPI.reportError(error);
    }
}

// Function to load the add coin form
async function loadAddCoin() {
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
                loadCollection(); // Return to collection view
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
        
        // Navigate back to collection view
        await loadCollection();
    } catch (error) {
        console.error('Error saving coin:', error);
        window.electronAPI.reportError(error);
        alert('Error saving coin: ' + error.message);
    }
}