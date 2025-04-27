// Custom date-fns bundle with just the functions we need
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.dateFns = {}));
})(this, (function (exports) { 'use strict';

    // format function implementation
    function format(date, formatStr) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        // Simple implementation that only handles 'yyyy-MM-dd' format
        // which is what the app uses
        return `${year}-${month}-${day}`;
    }

    // subMonths function implementation
    function subMonths(date, amount) {
        const d = new Date(date);
        d.setMonth(d.getMonth() - amount);
        return d;
    }

    // isBefore function implementation
    function isBefore(date1, date2) {
        return new Date(date1) < new Date(date2);
    }

    // Export the functions
    exports.format = format;
    exports.subMonths = subMonths;
    exports.isBefore = isBefore;

    Object.defineProperty(exports, '__esModule', { value: true });
}));

// No need for this as it creates a circular reference:
// window.dateFns = {
//     format: dateFns.format,
//     subMonths: dateFns.subMonths,
//     isBefore: dateFns.isBefore
// };

// Instead we'll just create a global dateFns object directly:
window.dateFns = {
    format: function(date, formatStr) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    subMonths: function(date, amount) {
        const d = new Date(date);
        d.setMonth(d.getMonth() - amount);
        return d;
    },
    isBefore: function(date1, date2) {
        return new Date(date1) < new Date(date2);
    }
}; 