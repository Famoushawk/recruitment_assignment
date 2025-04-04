import { initializeFileUpload } from './js/modules/fileUpload.js';
import { initializeFileList } from './js/modules/fileList.js';
import { initializeSearch } from './js/modules/search.js';
import { initializePagination } from './js/modules/pagination.js';
import { initializeSuggestions } from './js/modules/suggestions.js';
import { showNotification } from './js/modules/ui.js';

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