// chartConfig.js
const getChartConfig = (isDarkMode) => {
    const textColor = isDarkMode ? '#ecf0f1' : '#2c3e50';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    return {
        defaults: {
            font: {
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                color: textColor
            },
            color: textColor,
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    };
};

module.exports = { getChartConfig };