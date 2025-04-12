const path = require('path');
const fs = require('fs');

class WorldMap {
    constructor(containerId, collectionCountries = []) {
        this.containerId = containerId;
        this.collectionCountries = collectionCountries;
        this.container = null;
        this.tooltip = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error('Map container not found');
            }

            // Create tooltip element
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'map-tooltip';
            this.container.appendChild(this.tooltip);

            // Load SVG map
            const svgPath = path.join(__dirname, '..', '..', 'assets', 'world-map.svg');
            const svgContent = fs.readFileSync(svgPath, 'utf8');
            
            // Create map container
            const mapWrapper = document.createElement('div');
            mapWrapper.className = 'world-map-wrapper';
            mapWrapper.innerHTML = svgContent;
            this.container.appendChild(mapWrapper);

            // Setup event handlers
            this.setupEventHandlers();
            
            this.initialized = true;
            this.updateCollectionHighlights();
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.container.innerHTML = `
                <div class="map-error">
                    Failed to load map. Please try refreshing the page.
                </div>
            `;
        }
    }

    setupEventHandlers() {
        // Handle country hover events
        const countries = this.container.querySelectorAll('.country');
        countries.forEach(country => {
            country.addEventListener('mouseenter', (e) => this.handleCountryHover(e));
            country.addEventListener('mouseleave', () => this.hideTooltip());
            country.addEventListener('click', (e) => this.handleCountryClick(e));
        });

        // Update tooltip position on mouse move
        this.container.addEventListener('mousemove', (e) => {
            if (this.tooltip.style.display === 'block') {
                const bounds = this.container.getBoundingClientRect();
                const x = e.clientX - bounds.left + 10;
                const y = e.clientY - bounds.top + 10;
                
                this.tooltip.style.left = `${x}px`;
                this.tooltip.style.top = `${y}px`;
            }
        });
    }

    handleCountryHover(event) {
        const country = event.target;
        const countryName = country.getAttribute('data-name');
        const isCollected = this.collectionCountries.includes(countryName);

        this.tooltip.innerHTML = `
            <strong>${countryName}</strong><br>
            ${isCollected ? 
                `<span class="collected-status">In Collection! 🎯</span>` : 
                `<span class="not-collected-status">Not Collected Yet</span>`}
        `;
        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    handleCountryClick(event) {
        const countryName = event.target.getAttribute('data-name');
        // Dispatch custom event for country click
        const clickEvent = new CustomEvent('country-selected', {
            detail: { country: countryName }
        });
        this.container.dispatchEvent(clickEvent);
    }

    updateCollectionHighlights() {
        if (!this.initialized) return;

        const countries = this.container.querySelectorAll('.country');
        countries.forEach(country => {
            const countryName = country.getAttribute('data-name');
            if (this.collectionCountries.includes(countryName)) {
                country.classList.add('collected');
            } else {
                country.classList.remove('collected');
            }
        });
    }

    updateCollection(newCollectionCountries) {
        this.collectionCountries = newCollectionCountries;
        this.updateCollectionHighlights();
    }
}

module.exports = WorldMap;