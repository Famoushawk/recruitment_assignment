import { showNotification } from './ui.js';
import { formatDate, formatNumber } from './ui.js';
import { updateColumnSelectionUI } from './search.js';

let selectedFileId = null;
let fileList;

export function initializeFileList() {
    fileList = document.getElementById('fileList');
    loadFileList();
}

export function getSelectedFileId() {
    return selectedFileId;
}

export async function loadFileList() {
    try {
        const response = await fetch('/api/files/');
        if (!response.ok) {
            throw new Error('Failed to load files');
        }

        const data = await response.json();
        console.log('Loaded files:', data); // Debug log

        if (!fileList) {
            console.error('File list element not found');
            return;
        }

        if (data.files && Array.isArray(data.files)) {
            if (data.files.length > 0) {
                fileList.innerHTML = '';
                data.files.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = `file-item${file.id === selectedFileId ? ' active' : ''}`;
                    fileItem.dataset.fileId = file.id;

                    fileItem.innerHTML = `
                        <div class="file-info">
                            <div class="file-name">${file.filename}</div>
                            <div class="file-details">
                                Uploaded: ${formatDate(file.upload_date)} | Rows: ${formatNumber(file.row_count)}
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn-select-file${file.id === selectedFileId ? ' active' : ''}" onclick="window.selectFile(${file.id})">
                                ${file.id === selectedFileId ? 'Selected' : 'Select'}
                            </button>
                            <button class="btn-delete-file" onclick="window.deleteFile(${file.id}, '${file.filename}')">
                                Delete
                            </button>
                        </div>
                    `;

                    fileList.appendChild(fileItem);
                });
            } else {
                fileList.innerHTML = '<div class="no-files-message">No files uploaded yet.</div>';
            }
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading file list:', error);
        fileList.innerHTML = '<div class="no-files-message">Error loading files. Please try again.</div>';
        showNotification('Error loading file list', 'error');
    }
}

export async function selectFile(fileId) {
    try {
        const response = await fetch('/api/files/select/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_id: fileId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error selecting file');
        }

        // Update selected file ID
        selectedFileId = fileId;
        console.log('Selected file ID:', selectedFileId);

        // Update UI to show selected file
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const isSelected = item.dataset.fileId === fileId.toString();
            item.classList.toggle('active', isSelected);
            const selectBtn = item.querySelector('.btn-select-file');
            if (selectBtn) {
                selectBtn.textContent = isSelected ? 'Selected' : 'Select';
                selectBtn.classList.toggle('active', isSelected);
            }
        });

        // Update current file display
        updateCurrentFileDisplay(data.filename);

        // Load columns for the selected file
        if (data.columns && data.columns.length > 0) {
            updateColumnSelectionUI(data.columns);
        }

        showNotification('File selected successfully', 'success');
    } catch (error) {
        console.error('Error selecting file:', error);
        showNotification(error.message, 'error');
        selectedFileId = null;
    }
}

export async function deleteFile(fileId, fileName) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/files/${fileId}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }

        await loadFileList();
        showNotification('File deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('Error deleting file. Please try again.', 'error');
    }
}

function updateCurrentFileDisplay(fileName) {
    const fileInfo = document.getElementById('currentFileInfo');
    const fileNameElement = document.getElementById('currentFileName');
    
    if (fileName) {
        fileNameElement.textContent = `Currently searching in: ${fileName}`;
        fileInfo.style.display = 'flex';
    } else {
        fileInfo.style.display = 'none';
    }
}

// Add global functions for HTML onclick handlers
window.selectFile = selectFile;
window.deleteFile = deleteFile; 