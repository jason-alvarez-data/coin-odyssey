const { PythonShell } = require('python-shell');

console.log('Renderer.js Loaded');

// Event listener for the "Add Coin" button
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const addCoinButton = document.querySelector('.add-coin');
    console.log('Add Coin Button:', addCoinButton); // Check if button is found

    if (addCoinButton) {
        addCoinButton.addEventListener('click', function() {
            console.log('Add Coin button clicked'); // Check if click is registered
            
            // Load the HTML form
            fetch('src/forms/add_coin_form.html')
                .then(response => {
                    console.log('Fetch response:', response);
                    return response.text();
                })
                .then(html => {
                    console.log('HTML loaded');
                    document.getElementById('main-content').innerHTML = html;
                    setupFormHandlers();
                })
                .catch(error => {
                    console.error('Error loading form:', error);
                });
        });
    } else {
        console.error('Add Coin button not found');
    }
});

// Event listener for the theme switcher
document.getElementById('theme-switch').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
});

function setupFormHandlers() {
    const form = document.getElementById('coin-form');
    const closeButton = document.getElementById('close-form');
    const cancelButton = document.getElementById('cancel-add');

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const coinData = Object.fromEntries(formData);

        // Send to Python for database operations
        const { PythonShell } = require('python-shell');
        let options = {
            mode: 'json',
            scriptPath: 'src/database',
            args: [JSON.stringify(coinData)]
        };

        PythonShell.run('save_coin.py', options, function(err, results) {
            if (err) {
                console.error('Error saving coin:', err);
                return;
            }
            console.log('Coin saved successfully:', results);
            // Clear the form or return to previous view
            document.getElementById('main-content').innerHTML = '<p>Coin saved successfully!</p>';
        });
    });

    // Handle close/cancel
    [closeButton, cancelButton].forEach(button => {
        if (button) {
            button.addEventListener('click', function() {
                document.getElementById('main-content').innerHTML = '<p>Form closed</p>';
            });
        }
    });

    // Handle image uploads
    ['obverse-image', 'reverse-image'].forEach(id => {
        const input = document.getElementById(id);
        const preview = document.getElementById(id.replace('image', 'preview'));
        
        if (input && preview) {
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
}

// Error handling for Python shell operations
process.on('uncaughtException', function(err) {
    console.error('Uncaught exception:', err);
});