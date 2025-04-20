// Required Node.js modules
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Chart.js and adapters
const Chart = require('chart.js/auto');
const { Chart: ChartJS } = require('chart.js');
const { DateAdapter } = require('chartjs-adapter-date-fns');
const { enUS } = require('date-fns/locale');

// Register the date adapter
Chart.register(require('chartjs-adapter-date-fns'));

// Custom modules
const WorldMap = require('./src/components/worldMap.js');
const db = require('./src/database/db.js');
const { getChartConfig } = require('./chartConfig.js');

// Theme Constants
const THEME_KEY = 'app-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

// Global variables
let worldMap = null;

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
            worldMap.updateCollection(countryData);
        }
        
        // Update country badges
        updateCountryBadges(uniqueCountries);

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

        // Add action buttons
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

    // Add event listeners for edit and delete buttons
    setupActionButtons();
}

// Function to setup collection filters
function setupCollectionFilters() {
    const searchInput = document.getElementById('search-input');
    const searchField = document.getElementById('search-field');
    
    if (searchInput && searchField) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const searchFieldValue = searchField.value;
            const rows = document.querySelectorAll('#collection-table tbody tr');
            
            rows.forEach(row => {
                let match = false;
                if (searchFieldValue === 'All Fields') {
                    // Search all columns
                    const allText = Array.from(row.cells)
                        .map(cell => cell.textContent.toLowerCase())
                        .join(' ');
                    match = allText.includes(searchText);
                } else {
                    // Search specific column
                    const columnIndex = getColumnIndex(searchFieldValue);
                    if (columnIndex !== -1) {
                        const cellText = row.cells[columnIndex].textContent.toLowerCase();
                        match = cellText.includes(searchText);
                    }
                }
                row.style.display = match ? '' : 'none';
            });
        });
    }
}

// Function to get column index based on field name
function getColumnIndex(fieldName) {
    const columnMap = {
        'title': 1,
        'country': 3,
        'year': 2
    };
    return columnMap[fieldName] ?? -1;
}

// Function to load the analysis view
function loadAnalysis() {
    try {
        console.log('1. Starting loadAnalysis');
        
        const analysisPath = path.join(__dirname, 'src', 'forms', 'analysis.html');
        console.log('2. Analysis path:', analysisPath);
        
        if (!fs.existsSync(analysisPath)) {
            console.error('Analysis template not found at:', analysisPath);
            return;
        }
        
        const analysisContent = fs.readFileSync(analysisPath, 'utf8');
        console.log('3. Analysis content loaded');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content container not found');
            return;
        }
        
        mainContent.innerHTML = analysisContent;
        console.log('4. Analysis content inserted into DOM');

        // Short timeout to ensure DOM is ready
        setTimeout(() => {
            // Get all coins from database
            const coins = db.getAllCoins();
            console.log('6. Retrieved coins:', coins);
            
            // Initialize metrics
            updateAnalyticsMetrics(coins);
            console.log('7. Metrics updated');
            
            // Initialize charts
            console.log('8. About to initialize charts');
            initializeCharts(coins);
            console.log('9. Charts initialized');

            // Add these lines
            // Initialize value distribution table
            updateValueDistributionTable(coins, 'country'); // Default grouping by country
            setupDistributionControls(coins);
        }, 100);

    } catch (error) {
        console.error('Error in loadAnalysis:', error);
    }
}

// Function to update analytics metrics
function updateAnalyticsMetrics(coins) {
    try {
        console.log('Updating analytics metrics');
        
        // Calculate total value
        const totalValue = coins.reduce((sum, coin) => {
            return sum + (parseFloat(coin.current_value) || parseFloat(coin.value) || 0);
        }, 0);
        
        // Calculate unique countries
        const uniqueCountries = new Set(coins.map(coin => coin.country)).size;
        
        // Calculate year range
        const years = coins.map(coin => parseInt(coin.year)).filter(year => !isNaN(year));
        const yearRange = years.length > 0 
            ? `${Math.min(...years)} - ${Math.max(...years)}`
            : 'N/A';
        
        // Calculate collection growth (coins added in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCoins = coins.filter(coin => {
            const purchaseDate = new Date(coin.purchase_date);
            return purchaseDate >= thirtyDaysAgo;
        }).length;

        // Update DOM elements
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('country-count').textContent = uniqueCountries;
        document.getElementById('year-range').textContent = yearRange;
        document.getElementById('growth-rate').textContent = `+${recentCoins}`;

        // Calculate and update percentage change
        const previousMonthValue = calculatePreviousMonthValue(coins);
        const valueChange = previousMonthValue > 0 
            ? ((totalValue - previousMonthValue) / previousMonthValue) * 100 
            : 0;
        const valueChangeElement = document.querySelector('.metric-change');
        if (valueChangeElement) {
            valueChangeElement.textContent = `${valueChange.toFixed(1)}% from last month`;
        }

    } catch (error) {
        console.error('Error updating analytics metrics:', error);
    }
}

// Helper function to calculate previous month's collection value
function calculatePreviousMonthValue(coins) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return coins.reduce((sum, coin) => {
        const purchaseDate = new Date(coin.purchase_date);
        if (purchaseDate <= oneMonthAgo) {
            return sum + (parseFloat(coin.current_value) || parseFloat(coin.value) || 0);
        }
        return sum;
    }, 0);
}

// Function to initialize all charts
function initializeCharts(coins) {
    console.log('Initializing all charts');
    initializeValueTimelineChart(coins);
    initializeGeographicDistribution(coins);
    initializeYearDistribution(coins);
    initializeCollectionComposition(coins);
}

function initializeValueTimelineChart(coins) {
    console.log('Initializing value timeline chart');
    const canvas = document.getElementById('valueTimelineChart');
    
    if (!canvas) {
        console.error('Could not find valueTimelineChart canvas element');
        return;
    }

    // Process coins to create timeline data
    const timelineData = processCoinsForTimeline(coins);
    console.log('Timeline data:', timelineData);

    try {
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Collection Value',
                    data: timelineData.dataPoints,
                    borderColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--primary-color').trim(),
                    backgroundColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--primary-color').trim() + '33',
                    fill: true,
                    tension: 0.4,
                    pointStyle: 'circle',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--primary-color').trim(),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Collection Value Over Time'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `Value: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value ($)'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        console.log('Real data chart created successfully');
    } catch (error) {
        console.error('Error creating real data chart:', error);
    }
}

function initializeGeographicDistribution(coins) {
    console.log('Initializing geographic distribution chart');
    const canvas = document.getElementById('geographicDistributionChart');
    
    if (!canvas) {
        console.error('Could not find geographicDistributionChart canvas element');
        return;
    }

    // Process data for geographic distribution
    const countryData = processCountryData(coins);
    
    try {
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: countryData.labels,
                datasets: [{
                    data: countryData.values,
                    backgroundColor: generateColors(countryData.labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Geographic Distribution'
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-color').trim()
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value} coins (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating geographic distribution chart:', error);
    }
}

function initializeYearDistribution(coins) {
    console.log('Initializing year distribution chart');
    const canvas = document.getElementById('yearDistributionChart');
    
    if (!canvas) {
        console.error('Could not find yearDistributionChart canvas element');
        return;
    }

    // Process data for year distribution
    const yearData = processYearData(coins);
    
    try {
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: yearData.labels,
                datasets: [{
                    label: 'Number of Coins',
                    data: yearData.values,
                    backgroundColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--primary-color').trim() + '80',
                    borderColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--primary-color').trim(),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Year Distribution'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Coins'
                        },
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating year distribution chart:', error);
    }
}

function initializeCollectionComposition(coins) {
    console.log('Initializing collection composition chart');
    const canvas = document.getElementById('collectionCompositionChart');
    
    if (!canvas) {
        console.error('Could not find collectionCompositionChart canvas element');
        return;
    }

    // Process data for collection composition (by type)
    const typeData = processTypeData(coins);
    
    try {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: typeData.labels,
                datasets: [{
                    data: typeData.values,
                    backgroundColor: generateColors(typeData.labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Collection Composition by Type'
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-color').trim()
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value} coins (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating collection composition chart:', error);
    }
}

// Helper functions for data processing
function processCoinsForTimeline(coins) {
    console.log('Processing coins for timeline:', coins);
    
    // Filter out coins without purchase dates or values
    const validCoins = coins.filter(coin => {
        const hasDate = Boolean(coin.purchase_date);
        const hasValue = Boolean(coin.current_value || coin.value);
        return hasDate && hasValue;
    });

    console.log('Valid coins:', validCoins);

    // Sort coins by purchase date
    const sortedCoins = [...validCoins].sort((a, b) => {
        return new Date(a.purchase_date) - new Date(b.purchase_date);
    });

    console.log('Sorted coins:', sortedCoins);

    let labels = [];
    let dataPoints = [];
    let runningTotal = 0;

    // Create monthly data points
    sortedCoins.forEach(coin => {
        const date = new Date(coin.purchase_date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        const value = parseFloat(coin.current_value || coin.value || 0);
        
        runningTotal += value;

        // Add or update the value for this month
        const existingIndex = labels.indexOf(monthYear);
        if (existingIndex === -1) {
            labels.push(monthYear);
            dataPoints.push(runningTotal);
        } else {
            dataPoints[existingIndex] = Math.max(dataPoints[existingIndex], runningTotal);
        }
    });

    // If we have no data points, add a single point
    if (labels.length === 0) {
        const now = new Date();
        const currentMonth = `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
        labels.push(currentMonth);
        dataPoints.push(0);
    }

    console.log('Processed data:', {
        labels: labels,
        dataPoints: dataPoints
    });

    return {
        labels: labels,
        dataPoints: dataPoints
    };
}

function processCountryData(coins) {
    const countryCount = {};
    coins.forEach(coin => {
        if (coin.country) {
            countryCount[coin.country] = (countryCount[coin.country] || 0) + 1;
        }
    });

    // Sort by count in descending order
    const sortedData = Object.entries(countryCount)
        .sort(([,a], [,b]) => b - a);

    return {
        labels: sortedData.map(([country]) => country),
        values: sortedData.map(([,count]) => count)
    };
}

function processYearData(coins) {
    const yearCount = {};
    coins.forEach(coin => {
        if (coin.year) {
            yearCount[coin.year] = (yearCount[coin.year] || 0) + 1;
        }
    });

    // Sort years chronologically
    const sortedYears = Object.keys(yearCount).sort();

    return {
        labels: sortedYears,
        values: sortedYears.map(year => yearCount[year])
    };
}

function processTypeData(coins) {
    const typeCount = {};
    coins.forEach(coin => {
        const type = coin.type || 'Unspecified';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    // Sort by count in descending order
    const sortedData = Object.entries(typeCount)
        .sort(([,a], [,b]) => b - a);

    return {
        labels: sortedData.map(([type]) => type),
        values: sortedData.map(([,count]) => count)
    };
}

// Helper function to generate colors for charts
function generateColors(count) {
    const baseColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
    ];
    
    // If we need more colors than in our base array, generate them
    while (baseColors.length < count) {
        const hue = (baseColors.length * 137.508) % 360; // Use golden angle approximation
        baseColors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return baseColors.slice(0, count);
}

// Function to load settings
function loadSettings() {
    // Implementation for settings page
    console.log('Loading settings...');
}

// Function to initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === DARK_THEME;
        
        themeSwitch.addEventListener('change', function() {
            const newTheme = this.checked ? DARK_THEME : LIGHT_THEME;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
        });
    }
}

// Initialize application when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded, initializing app');
    
    // Initialize theme
    initializeTheme();
    
    // Load dashboard by default
    loadDashboard();
    
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
                case 'settings':
                    loadSettings();
                    break;
                case 'upload':
                    loadUploadCollection();
                    break;
                default:
                    console.warn(`Unknown view: ${view}`);
            }
        });
    });
});

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

// Function to setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('coin-form');
    const cancelButton = document.getElementById('cancel-add');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            
            // Create coin data object
            const coinData = {
                title: formData.get('title'),
                year: parseInt(formData.get('year')) || null,
                country: formData.get('country'),
                value: parseFloat(formData.get('value')) || null,
                unit: formData.get('unit'),
                mint: formData.get('mint'),
                mint_mark: formData.get('mint_mark'),
                type: formData.get('type'),
                format: formData.get('format'),
                series: formData.get('series'),
                region: formData.get('region'),
                storage: formData.get('storage'),
                status: formData.get('status'),
                quantity: parseInt(formData.get('quantity')) || 1,
                purchase_date: formData.get('purchase_date'),
                purchase_price: parseFloat(formData.get('purchase_price')) || null,
                current_value: parseFloat(formData.get('value')) || null
            };

            try {
                // Save coin to database
                const coinId = db.addCoin(coinData);
                console.log('Coin saved with ID:', coinId);
                alert('Coin saved successfully!');
                loadDashboard();
            } catch (error) {
                console.error('Error saving coin:', error);
                alert('Error saving coin: ' + error.message);
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            loadDashboard();
        });
    }
}

// Function to load the upload collection view
function loadUploadCollection() {
    try {
        console.log('Loading upload collection view');
        
        const uploadPath = path.join(__dirname, 'src', 'forms', 'upload_collection.html');
        const uploadContent = fs.readFileSync(uploadPath, 'utf8');
        document.getElementById('main-content').innerHTML = uploadContent;
        
        // Setup upload handlers
        setupUploadHandlers();
        
    } catch (error) {
        console.error('Error loading upload collection form:', error);
    }
}

// Function to setup upload handlers
function setupUploadHandlers() {
    const fileInput = document.getElementById('collection-file');
    const uploadBox = document.getElementById('upload-box');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const importButton = document.getElementById('import-button');
    const cancelButton = document.getElementById('cancel-upload');

    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);
    
    // Handle drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--primary-color)';
    });
    
    uploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--border-color)';
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });
    
    // Handle import button click
    importButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            importCollection(file);
        }
    });
    
    // Handle cancel button click
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            loadDashboard();
        });
    }
}

// Function to handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    handleFile(file);
}

// Function to handle file
function handleFile(file) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    
    if (file) {
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
    }
}

// Function to import collection
function importCollection(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const importDate = new Date().toISOString().split('T')[0]; // Today's date
        
        Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSV Headers:', results.meta.fields);
                
                // Show column mapping dialog
                const mappingDialog = document.createElement('div');
                mappingDialog.className = 'mapping-dialog';
                mappingDialog.innerHTML = `
                    <div class="mapping-content">
                        <h3>Map CSV Columns</h3>
                        <p>Match your CSV columns to the application fields:</p>
                        <div class="mapping-fields">
                            <div class="mapping-field">
                                <label for="title-map">Title (Required):</label>
                                <select id="title-map" required>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="date-map">Date Collected:</label>
                                <select id="date-map">
                                    <option value="">-- Use Import Date --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="value-map">Value:</label>
                                <select id="value-map">
                                    <option value="">-- Not Mapped --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="year-map">Year (Required):</label>
                                <select id="year-map" required>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="country-map">Country (Required):</label>
                                <select id="country-map" required>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="mint-map">Mint:</label>
                                <select id="mint-map">
                                    <option value="">-- Not Mapped --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="mint-mark-map">Mint Mark:</label>
                                <select id="mint-mark-map">
                                    <option value="">-- Not Mapped --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="type-map">Type:</label>
                                <select id="type-map">
                                    <option value="">-- Not Mapped --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                            <div class="mapping-field">
                                <label for="series-map">Series:</label>
                                <select id="series-map">
                                    <option value="">-- Not Mapped --</option>
                                    ${generateOptionsHtml(results.meta.fields)}
                                </select>
                            </div>
                        </div>
                        <div class="mapping-actions">
                            <button id="confirm-mapping" class="primary-button">Import Collection</button>
                            <button id="cancel-mapping" class="secondary-button">Cancel</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(mappingDialog);

                // Handle mapping confirmation
                document.getElementById('confirm-mapping').addEventListener('click', () => {
                    const mapping = {
                        title: document.getElementById('title-map').value,
                        date: document.getElementById('date-map').value,
                        value: document.getElementById('value-map').value,
                        year: document.getElementById('year-map').value,
                        country: document.getElementById('country-map').value,
                        mint: document.getElementById('mint-map').value,
                        mintMark: document.getElementById('mint-mark-map').value,
                        type: document.getElementById('type-map').value,
                        series: document.getElementById('series-map').value
                    };

                    // Validate required fields
                    if (!mapping.title || !mapping.year || !mapping.country) {
                        alert('Please map all required fields (Title, Year, and Country)');
                        return;
                    }

                    // Process data with mapping
                    const processedData = results.data.map(row => ({
                        title: row[mapping.title],
                        year: parseInt(row[mapping.year]) || null,
                        country: row[mapping.country],
                        value: parseFloat(row[mapping.value]) || null,
                        mint: mapping.mint ? row[mapping.mint] : null,
                        mint_mark: mapping.mintMark ? row[mapping.mintMark] : null,
                        type: mapping.type ? row[mapping.type] : null,
                        series: mapping.series ? row[mapping.series] : null,
                        purchase_date: mapping.date ? row[mapping.date] : importDate,
                        current_value: parseFloat(row[mapping.value]) || null
                    }));

                    try {
                        // Add each coin to the database
                        processedData.forEach(coinData => {
                            if (!coinData.title || !coinData.year || !coinData.country) {
                                console.warn('Skipping invalid coin:', coinData);
                                return;
                            }
                            db.addCoin(coinData);
                        });
                        
                        alert('Collection imported successfully!');
                        document.body.removeChild(mappingDialog);
                        loadDashboard();
                    } catch (error) {
                        console.error('Error importing collection:', error);
                        alert('Error importing collection: ' + error.message);
                    }
                });

                // Handle cancel
                document.getElementById('cancel-mapping').addEventListener('click', () => {
                    document.body.removeChild(mappingDialog);
                });
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing file: ' + error.message);
            }
        });
    };
    
    reader.readAsText(file);
}

// Helper function to generate options HTML
function generateOptionsHtml(fields) {
    return fields.map(field => 
        `<option value="${field}">${field}</option>`
    ).join('');
}

// Add this function to handle the value distribution table
function updateValueDistributionTable(coins, groupBy = 'country') {
    const tableBody = document.querySelector('.value-distribution-table tbody') || 
                     document.createElement('tbody');
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Group and calculate statistics
    const groupedData = {};
    coins.forEach(coin => {
        const key = coin[groupBy] || 'Unspecified';
        const value = parseFloat(coin.current_value || coin.value || 0);
        
        if (!groupedData[key]) {
            groupedData[key] = {
                count: 0,
                totalValue: 0,
                avgValue: 0
            };
        }
        
        groupedData[key].count++;
        groupedData[key].totalValue += value;
        groupedData[key].avgValue = groupedData[key].totalValue / groupedData[key].count;
    });

    // Calculate total collection value for percentage calculation
    const totalCollectionValue = Object.values(groupedData)
        .reduce((sum, group) => sum + group.totalValue, 0);

    // Create table rows
    Object.entries(groupedData).forEach(([category, data]) => {
        const row = document.createElement('tr');
        
        // Calculate percentage of total collection value
        const percentage = (data.totalValue / totalCollectionValue * 100).toFixed(1);
        
        row.innerHTML = `
            <td>${category}</td>
            <td>${data.count}</td>
            <td>$${data.totalValue.toFixed(2)}</td>
            <td>$${data.avgValue.toFixed(2)}</td>
            <td>${percentage}%</td>
        `;
        
        tableBody.appendChild(row);
    });

    // Find or create table
    let table = document.querySelector('.value-distribution-table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'value-distribution-table';
        
        // Create header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Total Value</th>
                <th>Avg Value</th>
                <th>% of Collection</th>
            </tr>
        `;
        table.appendChild(thead);
    }

    // Update table body
    const existingTbody = table.querySelector('tbody');
    if (existingTbody) {
        table.replaceChild(tableBody, existingTbody);
    } else {
        table.appendChild(tableBody);
    }

    // Find or create container
    const container = document.querySelector('.value-distribution-container');
    if (container) {
        const existingTable = container.querySelector('.value-distribution-table');
        if (existingTable) {
            container.replaceChild(table, existingTable);
        } else {
            container.appendChild(table);
        }
    }
}

// Add event listeners for the dropdown controls
function setupDistributionControls(coins) {
    const groupingSelect = document.querySelector('[data-control="grouping"]');
    if (groupingSelect) {
        groupingSelect.addEventListener('change', (e) => {
            updateValueDistributionTable(coins, e.target.value);
        });
    }
}

function setupActionButtons() {
    // Edit button handlers
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const coinId = e.currentTarget.dataset.coinId;
            showEditDialog(coinId);
        });
    });

    // Delete button handlers
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const coinId = e.currentTarget.dataset.coinId;
            if (confirm('Are you sure you want to delete this coin from your collection?')) {
                try {
                    db.deleteCoin(coinId);
                    loadCollection(); // Refresh the table
                    alert('Coin deleted successfully!');
                } catch (error) {
                    console.error('Error deleting coin:', error);
                    alert('Error deleting coin: ' + error.message);
                }
            }
        });
    });
}

function showEditDialog(coinId) {
    try {
        const coin = db.getCoinById(coinId);
        if (!coin) {
            throw new Error('Coin not found');
        }

        // Create edit dialog
        const editDialog = document.createElement('div');
        editDialog.className = 'edit-dialog';
        
        // Load the add coin form HTML and modify it for editing
        const formPath = path.join(__dirname, 'src', 'forms', 'add_coin_form.html');
        let formContent = fs.readFileSync(formPath, 'utf8');
        
        // Replace the form title
        formContent = formContent.replace('Add Coin', 'Edit Coin');
        
        // Remove the original form buttons by removing the form-actions div if it exists
        formContent = formContent.replace(/<div class="form-actions">.*?<\/div>/s, '');
        
        editDialog.innerHTML = `
            <div class="edit-content">
                <h3>Edit Coin</h3>
                ${formContent}
                <div class="form-actions">
                    <button type="button" id="save-edit" class="primary-button">Save</button>
                    <button type="button" id="cancel-edit" class="secondary-button">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(editDialog);

        // Populate form with coin data
        Object.keys(coin).forEach(key => {
            const input = editDialog.querySelector(`[name="${key}"]`);
            if (input) {
                if (key === 'purchase_date') {
                    // Format date for date input
                    const date = new Date(coin[key]);
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = coin[key] || '';
                }
            }
        });

        // Handle save
        document.getElementById('save-edit').addEventListener('click', () => {
            const formData = new FormData(editDialog.querySelector('form'));
            const updatedCoinData = {
                title: formData.get('title'),
                year: parseInt(formData.get('year')) || null,
                country: formData.get('country'),
                value: parseFloat(formData.get('value')) || null,
                unit: formData.get('unit'),
                mint: formData.get('mint'),
                mint_mark: formData.get('mint_mark'),
                type: formData.get('type'),
                format: formData.get('format'),
                series: formData.get('series'),
                region: formData.get('region'),
                storage: formData.get('storage'),
                status: formData.get('status'),
                quantity: parseInt(formData.get('quantity')) || 1,
                purchase_date: formData.get('purchase_date'),
                purchase_price: parseFloat(formData.get('purchase_price')) || null,
                current_value: parseFloat(formData.get('value')) || null
            };

            try {
                db.updateCoin(coinId, updatedCoinData);
                document.body.removeChild(editDialog);
                loadCollection(); // Refresh the table
                alert('Coin updated successfully!');
            } catch (error) {
                console.error('Error updating coin:', error);
                alert('Error updating coin: ' + error.message);
            }
        });

        // Handle cancel
        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.body.removeChild(editDialog);
        });

    } catch (error) {
        console.error('Error showing edit dialog:', error);
        alert('Error editing coin: ' + error.message);
    }
}