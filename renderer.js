document.getElementById('theme-switch').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
});

document.querySelector('.add-coin').addEventListener('click', function() {
    fetch('src/forms/add-coin-form.html')
      .then(response => response.text())
      .then(html => {
        document.getElementById('main-content').innerHTML = html;
  
        // Add event listeners for cancel and save buttons if needed
        document.getElementById('cancel-add').addEventListener('click', function() {
          // Logic to return to the previous screen
        });
  
        document.getElementById('save-coin').addEventListener('click', function() {
          // Logic to save the new coin
        });
      })
      .catch(error => console.error('Error loading form:', error));
  
    // Handle cancel button
    document.getElementById('cancel-add').addEventListener('click', function() {
      // Logic to return to the previous screen
    });
  
    // Handle save button
    document.getElementById('save-coin').addEventListener('click', function() {
      // Logic to save the new coin
    });
  });