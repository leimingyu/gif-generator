document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imageSequence = document.getElementById('imageSequence');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const gifPreview = document.getElementById('gifPreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const frameDelayInput = document.getElementById('frameDelay');
    const qualityInput = document.getElementById('quality');
    const resetBtn = document.getElementById('resetBtn');

    let images = [];
    let imageFiles = [];
    let draggedIndex = null;

    // Reset function
    function resetInterface() {
        // Clear arrays
        images = [];
        imageFiles = [];
        draggedIndex = null;
        
        // Clear UI
        imageSequence.innerHTML = '';
        generateBtn.disabled = true;
        resultSection.style.display = 'none';
        gifPreview.src = '';
        
        // Reset inputs
        fileInput.value = '';
        frameDelayInput.value = '500';
        qualityInput.value = '10';
        
        // Reset dropzone
        dropZone.style.borderColor = '#3498db';
    }

    // Add reset button event listener
    resetBtn.addEventListener('click', resetInterface);

    // Handle drag and drop for file upload
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2980b9';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
        handleFiles(e.dataTransfer.files);
    });

    // Handle click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        const validImageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (validImageFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }

        // Clear previous images
        images = [];
        imageFiles = [];
        imageSequence.innerHTML = '';
        generateBtn.disabled = true;
        resultSection.style.display = 'none';

        // Load new images
        validImageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    images.push(img);
                    imageFiles.push(file);
                    displayImage(img, images.length - 1);
                    
                    if (images.length === validImageFiles.length) {
                        generateBtn.disabled = false;
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    }

    function displayImage(img, index) {
        const container = document.createElement('div');
        container.className = 'image-container';
        container.draggable = true;
        container.dataset.index = index;
        
        const preview = document.createElement('img');
        preview.src = img.src;
        preview.alt = `Frame ${index + 1}`;
        
        // Add frame number
        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeImage(index);
        };
        
        container.appendChild(preview);
        container.appendChild(frameNumber);
        container.appendChild(removeBtn);
        imageSequence.appendChild(container);

        // Add drag and drop functionality for reordering
        container.addEventListener('dragstart', (e) => {
            draggedIndex = index;
            container.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            frameNumber.style.opacity = '0';
            
            // Hide all drop indicators initially
            Array.from(imageSequence.children).forEach(child => {
                child.classList.remove('drop-left', 'drop-right');
            });
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (draggedIndex === null || draggedIndex === index) return;
            
            const rect = container.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            
            // Remove previous indicators
            container.classList.remove('drop-left', 'drop-right');
            
            // Add new indicator based on mouse position
            if (e.clientX < midX) {
                container.classList.add('drop-left');
            } else {
                container.classList.add('drop-right');
            }
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drop-left', 'drop-right');
        });

        container.addEventListener('dragend', () => {
            container.classList.remove('dragging');
            draggedIndex = null;
            
            // Show the frame number again
            frameNumber.style.opacity = '1';
            
            // Remove all drag feedback
            Array.from(imageSequence.children).forEach(child => {
                child.classList.remove('drop-left', 'drop-right');
                child.querySelector('.frame-number').style.opacity = '1';
            });
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drop-left', 'drop-right');
            
            if (draggedIndex === null || draggedIndex === index) return;
            
            const rect = container.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            const newIndex = e.clientX < midX ? index : index + 1;
            
            // Reorder arrays
            const [movedImage] = images.splice(draggedIndex, 1);
            const [movedFile] = imageFiles.splice(draggedIndex, 1);
            
            // Insert at the correct position
            const adjustedIndex = newIndex > draggedIndex ? newIndex - 1 : newIndex;
            images.splice(adjustedIndex, 0, movedImage);
            imageFiles.splice(adjustedIndex, 0, movedFile);
            
            // Update the display
            imageSequence.innerHTML = '';
            images.forEach((img, i) => displayImage(img, i));
        });
    }

    function removeImage(index) {
        images.splice(index, 1);
        imageFiles.splice(index, 1);
        imageSequence.innerHTML = '';
        images.forEach((img, i) => displayImage(img, i));
        generateBtn.disabled = images.length === 0;
        resultSection.style.display = 'none';
    }

    generateBtn.addEventListener('click', async () => {
        if (images.length === 0) return;

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const formData = new FormData();
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
            formData.append('frameDelay', frameDelayInput.value);
            formData.append('quality', qualityInput.value);

            const response = await fetch('/generate-gif', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to generate GIF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            gifPreview.src = url;
            resultSection.style.display = 'block';
        } catch (error) {
            alert('Error generating GIF: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate GIF';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!gifPreview.src) return;

        const link = document.createElement('a');
        link.href = gifPreview.src;
        link.download = 'generated.gif';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}); 