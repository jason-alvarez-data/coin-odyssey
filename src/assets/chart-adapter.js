// Simple Chart.js date adapter using our date-fns implementation
(function(global) {
    // Make sure Chart and dateFns exist
    if (!global.Chart || !global.dateFns) {
        console.error('Chart.js or date-fns not found');
        return;
    }

    // Define adapter
    const adapter = {
        _id: 'dateFns',
        formats: function() {
            return {
                datetime: 'MMM d, yyyy, h:mm:ss a',
                millisecond: 'h:mm:ss.SSS a',
                second: 'h:mm:ss a',
                minute: 'h:mm a',
                hour: 'ha',
                day: 'MMM d',
                week: 'PP',
                month: 'MMM yyyy',
                quarter: 'qqq - yyyy',
                year: 'yyyy'
            };
        },
        parse: function(value) {
            if (value === null || value === undefined) {
                return null;
            }
            
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        },
        format: function(time, format) {
            return dateFns.format(time, format);
        },
        add: function(time, amount, unit) {
            // Handle null or invalid dates
            if (!time || typeof time.getMonth !== 'function') {
                return new Date();
            }
            
            // Clone the date to avoid modifying the original
            const newTime = new Date(time);
            
            switch (unit) {
                case 'day':
                    newTime.setDate(newTime.getDate() + amount);
                    break;
                case 'month':
                    newTime.setMonth(newTime.getMonth() + amount);
                    break;
                case 'year':
                    newTime.setFullYear(newTime.getFullYear() + amount);
                    break;
                case 'hour':
                    newTime.setHours(newTime.getHours() + amount);
                    break;
                case 'minute':
                    newTime.setMinutes(newTime.getMinutes() + amount);
                    break;
                case 'second':
                    newTime.setSeconds(newTime.getSeconds() + amount);
                    break;
            }
            return newTime;
        },
        diff: function(max, min, unit) {
            // Handle null or invalid dates
            if (!max || !min || typeof max.getFullYear !== 'function' || typeof min.getFullYear !== 'function') {
                return 0;
            }
            
            const diffMs = max - min;
            
            switch (unit) {
                case 'millisecond':
                    return diffMs;
                case 'second':
                    return Math.floor(diffMs / 1000);
                case 'minute':
                    return Math.floor(diffMs / 60000);
                case 'hour':
                    return Math.floor(diffMs / 3600000);
                case 'day':
                    return Math.floor(diffMs / 86400000);
                case 'week':
                    return Math.floor(diffMs / 604800000);
                case 'month':
                    const months = (max.getFullYear() - min.getFullYear()) * 12;
                    return months + (max.getMonth() - min.getMonth());
                case 'year':
                    return max.getFullYear() - min.getFullYear();
                default:
                    return diffMs;
            }
        },
        startOf: function(time, unit) {
            // Handle null or invalid dates
            if (!time || typeof time.getMonth !== 'function') {
                return new Date();
            }
            
            const newTime = new Date(time);
            
            switch (unit) {
                case 'second':
                    newTime.setMilliseconds(0);
                    break;
                case 'minute':
                    newTime.setSeconds(0, 0);
                    break;
                case 'hour':
                    newTime.setMinutes(0, 0, 0);
                    break;
                case 'day':
                    newTime.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    // Get to the first day of the week (Sunday)
                    const dayOfWeek = newTime.getDay();
                    newTime.setDate(newTime.getDate() - dayOfWeek);
                    newTime.setHours(0, 0, 0, 0);
                    break;
                case 'month':
                    newTime.setDate(1);
                    newTime.setHours(0, 0, 0, 0);
                    break;
                case 'year':
                    newTime.setMonth(0, 1);
                    newTime.setHours(0, 0, 0, 0);
                    break;
            }
            
            return newTime;
        },
        endOf: function(time, unit) {
            // Handle null or invalid dates
            if (!time || typeof time.getMonth !== 'function') {
                return new Date();
            }
            
            const newTime = this.startOf(time, unit);
            
            switch (unit) {
                case 'second':
                    newTime.setMilliseconds(999);
                    break;
                case 'minute':
                    newTime.setSeconds(59, 999);
                    break;
                case 'hour':
                    newTime.setMinutes(59, 59, 999);
                    break;
                case 'day':
                    newTime.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    newTime.setDate(newTime.getDate() + 6);
                    newTime.setHours(23, 59, 59, 999);
                    break;
                case 'month':
                    // Go to the next month, then back one day
                    newTime.setMonth(newTime.getMonth() + 1, 0);
                    newTime.setHours(23, 59, 59, 999);
                    break;
                case 'year':
                    newTime.setMonth(11, 31);
                    newTime.setHours(23, 59, 59, 999);
                    break;
            }
            
            return newTime;
        }
    };

    // Register the adapter with Chart.js
    Chart._adapters._date.override(adapter);
    
})(typeof window !== 'undefined' ? window : this); 