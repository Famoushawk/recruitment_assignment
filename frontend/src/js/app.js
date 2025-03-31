import { initializeFileUpload } from './modules/fileUpload.js';
import { initializeFileList } from './modules/fileList.js';
import { initializeSearch } from './modules/search.js';
import { initializePagination } from './modules/pagination.js';
import { initializeSuggestions } from './modules/suggestions.js';
import { showNotification } from './modules/ui.js';

// Initialize all modules when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeFileUpload();
        initializeFileList();
        initializeSearch();
        initializePagination();
        initializeSuggestions();
    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Error initializing application', 'error');
    }
});

// Global functions needed for HTML onclick handlers
window.showNotification = showNotification; 