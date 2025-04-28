// Remove Node.js require statements
// const path = require('path');
// const fs = require('fs');

class WorldMap {
    constructor(containerId, countryData = {}) {
        this.containerId = containerId;
        this.countryData = countryData;
        this.container = null;
        this.tooltip = null;
        this.initialized = false;
        this.eventListeners = new Map(); // Store event listeners for cleanup
        
        // Add country name mapping
        this.countryNameMapping = {
            // Common variations
            'United States of America': 'United States',
            'USA': 'United States',
            'US': 'United States',
            'UNITED STATES': 'United States',
            'United Kingdom': 'UK',
            'Great Britain': 'UK',
            'Russian Federation': 'Russia',
            'People\'s Republic of China': 'China',
            'PRC': 'China',
            // Add more mappings as needed
        };
    }

    async initialize() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error('Map container not found');
            }

            // Clear the container first
            this.container.innerHTML = '';
            
            // Create a wrapper div with proper sizing
            const mapWrapper = document.createElement('div');
            mapWrapper.className = 'world-map-wrapper';
            mapWrapper.style.width = '100%';
            mapWrapper.style.height = '100%';
            mapWrapper.style.position = 'relative';
            mapWrapper.style.overflow = 'hidden';
            
            // Fetch and load the SVG content directly
            try {
                const response = await fetch('src/assets/world-map.svg');
                const svgContent = await response.text();
                
                // Create a temporary div to parse the SVG content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svgContent;
                
                // Get the first SVG element
                const svg = tempDiv.querySelector('svg');
                if (svg) {
                    // Set proper SVG attributes for responsive sizing
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '100%');
                    svg.style.display = 'block';
                    svg.style.maxWidth = '100%';
                    svg.style.maxHeight = '100%';
                    
                    // Only append the SVG element, not the entire content
                    mapWrapper.appendChild(svg);
                } else {
                    throw new Error('No SVG element found in the content');
                }
            } catch (error) {
                console.error('Failed to load SVG:', error);
                throw error;
            }
            
            // Add the wrapper to the container
            this.container.appendChild(mapWrapper);
            
            // Create tooltip element
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'map-tooltip';
            this.tooltip.style.position = 'absolute';
            this.tooltip.style.backgroundColor = 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))';
            this.tooltip.style.color = 'var(--tooltip-text, #000)';
            this.tooltip.style.padding = '8px 12px';
            this.tooltip.style.border = '1px solid var(--tooltip-border, rgba(0, 0, 0, 0.1))';
            this.tooltip.style.borderRadius = '6px';
            this.tooltip.style.pointerEvents = 'none';
            this.tooltip.style.display = 'none';
            this.tooltip.style.zIndex = '1000';
            this.tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            this.tooltip.style.fontSize = '14px';
            this.tooltip.style.lineHeight = '1.4';
            this.tooltip.style.minWidth = '150px';
            this.container.appendChild(this.tooltip);

            // Add CSS variables for theme support
            const style = document.createElement('style');
            style.textContent = `
                :root {
                    --tooltip-bg: rgba(255, 255, 255, 0.95);
                    --tooltip-text: #000;
                    --tooltip-border: rgba(0, 0, 0, 0.1);
                }
                
                [data-theme="dark"] {
                    --tooltip-bg: rgba(50, 50, 50, 0.95);
                    --tooltip-text: #fff;
                    --tooltip-border: rgba(255, 255, 255, 0.1);
                }
            `;
            document.head.appendChild(style);
            
            // Set the container position to relative for proper tooltip positioning
            this.container.style.position = 'relative';
            
            // Initialize event listeners
            await this.loadMapData();
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.container.innerHTML = `
                <div class="map-error">
                    Failed to load map. Please try refreshing the page.
                </div>
            `;
        }
    }
    
    async loadMapData() {
        try {
            const svg = this.container.querySelector('svg');
            if (!svg) {
                throw new Error('SVG element not found');
            }

            // Add event listeners to all country paths
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
                // Get country name and check if we have coins from this country
                let countryName = path.getAttribute('name') || path.getAttribute('id');
                if (!countryName) {
                    const className = path.getAttribute('class');
                    if (className) {
                        countryName = className.split(' ')
                            .filter(c => c !== 'land')
                            .map(c => c.toUpperCase())
                            .join(' ');
                    }
                }

                // Set initial color based on collection
                if (countryName) {
                    const standardizedName = this.countryNameMapping[countryName] || countryName;
                    const coinCount = this.countryData[standardizedName] || 0;
                    if (coinCount > 0) {
                        path.style.fill = '#4A90E2'; // Brighter blue color for better visibility
                        path.style.transition = 'fill 0.3s ease'; // Smooth transition for hover effects
                    }
                }

                // Create event listener functions
                const mousemoveHandler = (e) => {
                    const countryId = path.getAttribute('id');
                    let countryName = path.getAttribute('name') || path.getAttribute('id');
                    
                    // If name attribute is not available, try to get it from class
                    if (!countryName) {
                        const className = path.getAttribute('class');
                        if (className) {
                            countryName = className.split(' ')
                                .filter(c => c !== 'land')
                                .map(c => c.toUpperCase())
                                .join(' ');
                        }
                    }
                    
                    if (countryName) {
                        // Try to get the standardized country name
                        const standardizedName = this.countryNameMapping[countryName] || countryName;
                        const coinCount = this.countryData[standardizedName] || 0;
                        
                        this.tooltip.innerHTML = `
                            <strong>${standardizedName}</strong><br>
                            Coins in collection: ${coinCount}
                        `;
                        
                        const containerBounds = this.container.getBoundingClientRect();
                        const tooltipX = e.clientX - containerBounds.left + 10;
                        const tooltipY = e.clientY - containerBounds.top + 10;
                        
                        // Keep tooltip within container bounds
                        const tooltipBounds = this.tooltip.getBoundingClientRect();
                        const maxX = containerBounds.width - tooltipBounds.width - 10;
                        const maxY = containerBounds.height - tooltipBounds.height - 10;
                        
                        this.tooltip.style.left = `${Math.min(tooltipX, maxX)}px`;
                        this.tooltip.style.top = `${Math.min(tooltipY, maxY)}px`;
                        this.tooltip.style.display = 'block';
                    }
                };

                const mouseleaveHandler = () => {
                    this.hideTooltip();
                };

                const mouseenterHandler = () => {
                    const standardizedName = this.countryNameMapping[countryName] || countryName;
                    const coinCount = this.countryData[standardizedName] || 0;
                    // Only change to gray if we don't have coins from this country
                    if (coinCount === 0) {
                        path.style.fill = '#ccc';
                    }
                };

                const mouseleaveStyleHandler = () => {
                    const standardizedName = this.countryNameMapping[countryName] || countryName;
                    const coinCount = this.countryData[standardizedName] || 0;
                    // Reset to light blue if we have coins, or no fill if we don't
                    path.style.fill = coinCount > 0 ? '#4A90E2' : '';
                };

                // Store event listeners for this path
                this.eventListeners.set(path, {
                    mousemove: mousemoveHandler,
                    mouseleave: mouseleaveHandler,
                    mouseenter: mouseenterHandler,
                    mouseleaveStyle: mouseleaveStyleHandler
                });

                // Add event listeners
                path.addEventListener('mousemove', mousemoveHandler);
                path.addEventListener('mouseleave', mouseleaveHandler);
                path.addEventListener('mouseenter', mouseenterHandler);
                path.addEventListener('mouseleave', mouseleaveStyleHandler);
                path.style.cursor = 'pointer';
            });

        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    updateCollection(newCountryData) {
        this.countryData = newCountryData;
    }

    destroy() {
        if (this.container) {
            const svg = this.container.querySelector('svg');
            if (svg) {
                const paths = svg.querySelectorAll('path');
                paths.forEach(path => {
                    // Remove event listeners using stored references
                    const listeners = this.eventListeners.get(path);
                    if (listeners) {
                        path.removeEventListener('mousemove', listeners.mousemove);
                        path.removeEventListener('mouseleave', listeners.mouseleave);
                        path.removeEventListener('mouseenter', listeners.mouseenter);
                        path.removeEventListener('mouseleave', listeners.mouseleaveStyle);
                    }
                });
            }
            
            // Clear the event listeners map
            this.eventListeners.clear();
            
            // Clear the container
            this.container.innerHTML = '';
            
            // Reset instance variables
            this.container = null;
            this.tooltip = null;
            this.initialized = false;
        }
    }
}

// Make WorldMap available globally
window.WorldMap = WorldMap;