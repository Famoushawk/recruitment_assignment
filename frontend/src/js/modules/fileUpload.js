import { showNotification } from './ui.js';
import { selectFile } from './fileList.js';
import { loadFileList } from './fileList.js';

let uploadButton;
let fileInput;
let progressContainer;
let progressBar;
let progressText;
let progressStatus;

export function initializeFileUpload() {
    uploadButton = document.getElementById('uploadButton');
    fileInput = document.getElementById('fileInput');
    progressContainer = document.getElementById('uploadProgress');
    progressBar = document.getElementById('progressBar');
    progressText = document.getElementById('progressText');
    progressStatus = document.getElementById('progressStatus');

    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', handleFileUpload);
    }
}

async function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) {
        showNotification('Please select a file first', 'warning');
        return;
    }

    // Show progress container and reset progress
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Uploading file...';
    uploadButton.disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();

        // Update progress UI
        progressBar.style.width = '100%';
        progressText.textContent = 'Upload complete!';

        // Clear file input
        fileInput.value = '';
        uploadButton.disabled = false;

        // Refresh the file list first
        await loadFileList();

        // Then select the newly uploaded file
        if (data.file_id) {
            await selectFile(data.file_id);
        }

        showNotification('File uploaded successfully', 'success');

        // Hide progress after delay
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('Upload error:', error);
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = '#dc3545';
        progressText.textContent = 'Error uploading file';
        uploadButton.disabled = false;
        showNotification('Error uploading file', 'error');
    }
} 