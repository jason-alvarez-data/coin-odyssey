// Simple implementation of the color functions needed by chart.js
// This provides a minimal implementation to keep the app working

(function(global) {
    // Simple color parser and utilities
    const Color = function(r, g, b, a) {
        if (!(this instanceof Color)) {
            return new Color(r, g, b, a);
        }
        
        if (typeof r === 'string') {
            // Parse color string
            const color = parseColorString(r);
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
        } else {
            this.r = r || 0;
            this.g = g || 0; 
            this.b = b || 0;
            this.a = a !== undefined ? a : 1;
        }
    };

    // Parse a color string like 'rgb(255,0,0)' or '#ff0000'
    function parseColorString(str) {
        // Default color
        const color = { r: 0, g: 0, b: 0, a: 1 };
        
        // Handle hex colors
        if (str.startsWith('#')) {
            const hex = str.substring(1);
            if (hex.length === 3) {
                color.r = parseInt(hex[0] + hex[0], 16);
                color.g = parseInt(hex[1] + hex[1], 16);
                color.b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                color.r = parseInt(hex.substring(0, 2), 16);
                color.g = parseInt(hex.substring(2, 4), 16);
                color.b = parseInt(hex.substring(4, 6), 16);
            }
            return color;
        }
        
        // Handle rgb/rgba colors
        if (str.startsWith('rgb')) {
            const values = str.match(/\d+/g);
            if (values && values.length >= 3) {
                color.r = parseInt(values[0]);
                color.g = parseInt(values[1]);
                color.b = parseInt(values[2]);
                if (values.length === 4) {
                    color.a = parseFloat(values[3]);
                }
            }
            return color;
        }
        
        return color;
    }
    
    // Add methods to the Color prototype
    Color.prototype = {
        toString: function() {
            return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
        },
        rgb: function() {
            return `rgb(${this.r}, ${this.g}, ${this.b})`;
        },
        alpha: function(a) {
            return new Color(this.r, this.g, this.b, a);
        }
    };
    
    // Methods used by chart.js
    Color.fromString = function(str) {
        return new Color(str);
    };
    
    // Expose Color to the global object
    global.Color = Color;
})(typeof window !== 'undefined' ? window : this); 