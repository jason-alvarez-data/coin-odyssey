class EditCoinForm {
    constructor() {
        // Initialize properties to null
        this.dialog = null;
        this.form = null;
        this.obversePreview = null;
        this.reversePreview = null;
        this.obverseInput = null;
        this.reverseInput = null;
        this.modalElement = null; // Store the modal element
    }

    // Accept modal element, query within it
    initializeElementsAndListeners(modalElement) {
        if (!modalElement) {
            console.error('EditCoinForm received invalid modalElement for initialization.');
            return;
        }
        this.modalElement = modalElement;
        console.log('Initializing elements within modal...', modalElement);

        // Query within the modal element using CORRECT IDs 
        this.dialog = modalElement; 
        this.form = modalElement.querySelector('#edit-coin-form');
        console.log('Query for #edit-coin-form:', this.form ? 'Found' : 'Not Found');
        
        this.obversePreview = modalElement.querySelector('#obverse-preview');
        console.log('Query for #obverse-preview:', this.obversePreview ? 'Found' : 'Not Found');
        
        this.reversePreview = modalElement.querySelector('#reverse-preview');
        console.log('Query for #reverse-preview:', this.reversePreview ? 'Found' : 'Not Found');
        
        // Use the correct file input IDs: #obverse-input / #reverse-input
        this.obverseInput = modalElement.querySelector('#obverse-input'); 
        console.log('Query for #obverse-input:', this.obverseInput ? 'Found' : 'Not Found');
        
        this.reverseInput = modalElement.querySelector('#reverse-input'); 
        console.log('Query for #reverse-input:', this.reverseInput ? 'Found' : 'Not Found');
        
        // Now check if elements were found
        if (!this.form || !this.obversePreview || !this.reversePreview || !this.obverseInput || !this.reverseInput) {
            console.error('EditCoinForm could not find all required elements WITHIN the modal during initialization.', {
                form: !!this.form,
                obversePreview: !!this.obversePreview,
                reversePreview: !!this.reversePreview,
                obverseInput: !!this.obverseInput,
                reverseInput: !!this.reverseInput
            });
            console.log('Modal innerHTML at time of failure:', this.modalElement.innerHTML);
            return; // Stop if elements are missing
        }

        console.log('EditCoinForm elements queried successfully within modal using corrected IDs.');
        this.setupImageUploads(); 
        this.setupFormSubmit(); 
    }

    setupImageUploads() {
        this.setupImageUpload(this.obversePreview, this.obverseInput, 'obverse');
        this.setupImageUpload(this.reversePreview, this.reverseInput, 'reverse');
    }

    setupImageUpload(previewElement, inputElement, side) {
        if (!previewElement || !inputElement) {
            console.error(`Could not find ${side} preview or input element for listener setup.`);
            return;
        }
        console.log(`Setting up listeners for ${side}`);

        previewElement.addEventListener('click', () => {
            console.log(`${side} preview clicked`);
            inputElement.click(); 
        });

        inputElement.addEventListener('change', (event) => {
            const file = event.target.files[0];
            console.log(`${side} file input changed:`, file ? file.name : 'No file');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewElement.style.backgroundImage = `url(${e.target.result})`;
                    previewElement.classList.add('has-image');
                    const placeholder = previewElement.querySelector('.preview-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        previewElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            previewElement.classList.add('dragover');
        });

        previewElement.addEventListener('dragleave', () => {
            previewElement.classList.remove('dragover');
        });

        previewElement.addEventListener('drop', (e) => {
            e.preventDefault();
            previewElement.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            console.log(`${side} file dropped:`, file ? file.name : 'No file');
            if (file && file.type.startsWith('image/')) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                inputElement.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                inputElement.dispatchEvent(event);
            }
        });
    }

    setupFormSubmit() {
        if (!this.form) return;
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('EditCoinForm submit listener triggered (potentially redundant)');
        });
    }

    clearForm() {
        if (this.form) this.form.reset();
        [this.obversePreview, this.reversePreview].forEach(preview => {
            if (preview) {
                preview.style.backgroundImage = '';
                preview.classList.remove('has-image');
                preview.classList.remove('dragover');
                const placeholder = preview.querySelector('.preview-placeholder');
                if (placeholder) {
                    placeholder.style.display = ''; 
                }
                const img = preview.querySelector('img');
                if (img) img.remove();
            }
        });
        // Reset file inputs using the correct references
        if (this.obverseInput) this.obverseInput.value = null;
        if (this.reverseInput) this.reverseInput.value = null;
    }

    closeDialog() {
        // Close logic might need adjustment if modalElement is primary reference
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
        }
    }

    populateForm(coinData) {
        // Query within modal if form wasn't found initially?
        if (!this.form) {
             this.form = this.modalElement ? this.modalElement.querySelector('#edit-coin-form') : null;
        }
        if (!this.form || !coinData) return;
        
        Object.keys(coinData).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'date' && coinData[key]) {
                     try {
                        input.value = new Date(coinData[key]).toISOString().split('T')[0];
                     } catch (e) { input.value = ''; }
                } else {
                     input.value = coinData[key] ?? '';
                }
            }
        });
        // Ensure previews are queried if not found initially
        if (!this.obversePreview) this.obversePreview = this.modalElement ? this.modalElement.querySelector('#obverse-preview') : null;
        if (!this.reversePreview) this.reversePreview = this.modalElement ? this.modalElement.querySelector('#reverse-preview') : null;
        this.updateImagePreview(this.obversePreview, coinData.obverse_image);
        this.updateImagePreview(this.reversePreview, coinData.reverse_image);
    }
    
    updateImagePreview(previewElement, imageData) {
         if (!previewElement) return;
         const placeholder = previewElement.querySelector('.preview-placeholder');
         if (imageData) {
            previewElement.style.backgroundImage = `url(${imageData})`;
            previewElement.classList.add('has-image');
            if (placeholder) placeholder.style.display = 'none';
         } else {
            previewElement.style.backgroundImage = '';
            previewElement.classList.remove('has-image');
            if (placeholder) placeholder.style.display = ''; 
         }
    }
} 