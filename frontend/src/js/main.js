import { initializeFileUpload } from './modules/fileUpload.js';
import { initializeFileList } from './modules/fileList.js';
import { initializeSearch } from './modules/search.js';
import { initializeSuggestions } from './modules/suggestions.js';
import { initializePagination } from './modules/pagination.js';
import { initializeUI } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    initializeFileUpload();
    initializeFileList();
    initializeSearch();
    initializeSuggestions();
    initializePagination();
}); 