import { getSelectedFileId } from './fileList.js';

let searchInput;
let suggestionsList;
let suggestionsTimer = null;
let currentSuggestions = [];

export function initializeSuggestions() {
    searchInput = document.getElementById('searchValue');
    suggestionsList = document.getElementById('suggestionsList');

    if (searchInput && suggestionsList) {
        setupEventListeners();
    }
}

function setupEventListeners() {
    // Handle input changes with debounce
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();

        if (suggestionsTimer) {
            clearTimeout(suggestionsTimer);
        }

        if (!getSelectedFileId()) {
            return;
        }

        suggestionsTimer = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && e.target !== suggestionsList && !suggestionsList.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });

    // Show suggestions again when focusing on input
    searchInput.addEventListener('focus', () => {
        if (currentSuggestions.length > 0) {
            suggestionsList.style.display = 'block';
        }
    });

    // Handle keyboard navigation in suggestions
    searchInput.addEventListener('keydown', handleKeyboardNavigation);
}

async function fetchSuggestions(query) {
    if (!query || query.length < 2) {
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/suggestions/?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        currentSuggestions = data.suggestions;

        // Display suggestions
        if (currentSuggestions.length > 0) {
            suggestionsList.innerHTML = '';

            currentSuggestions.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';

                // Highlight the matching part
                const value = suggestion.value;
                const queryLower = query.toLowerCase();
                const valueLower = value.toLowerCase();
                const matchIndex = valueLower.indexOf(queryLower);

                let displayHTML = '';
                if (matchIndex >= 0) {
                    displayHTML =
                        value.substring(0, matchIndex) +
                        '<strong>' + value.substring(matchIndex, matchIndex + query.length) + '</strong>' +
                        value.substring(matchIndex + query.length);
                } else {
                    displayHTML = value;
                }

                // Add field information
                displayHTML += ` <span class="suggestion-field">(${suggestion.field})</span>`;
                item.innerHTML = displayHTML;

                // Handle click on suggestion
                item.addEventListener('click', () => {
                    searchInput.value = suggestion.value;
                    suggestionsList.style.display = 'none';
                    searchInput.focus();
                });

                suggestionsList.appendChild(item);
            });

            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
    }
}

function handleKeyboardNavigation(e) {
    if (!suggestionsList.style.display || suggestionsList.style.display === 'none') {
        return;
    }

    const suggestionItems = suggestionsList.querySelectorAll('.suggestion-item');
    if (suggestionItems.length === 0) {
        return;
    }

    // Find currently selected item
    const currentSelected = suggestionsList.querySelector('.suggestion-item.selected');
    let currentIndex = -1;

    if (currentSelected) {
        currentIndex = Array.from(suggestionItems).indexOf(currentSelected);
    }

    // Handle arrow keys
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < suggestionItems.length - 1) {
            if (currentSelected) {
                currentSelected.classList.remove('selected');
            }
            suggestionItems[currentIndex + 1].classList.add('selected');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
            if (currentSelected) {
                currentSelected.classList.remove('selected');
            }
            suggestionItems[currentIndex - 1].classList.add('selected');
        }
    } else if (e.key === 'Enter' && currentSelected) {
        e.preventDefault();
        searchInput.value = currentSuggestions[currentIndex].value;
        suggestionsList.style.display = 'none';
    } else if (e.key === 'Escape') {
        suggestionsList.style.display = 'none';
    }
}

export async function getSuggestions(term) {
    try {
        const response = await fetch(`/api/suggestions/?term=${encodeURIComponent(term)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        return data.suggestions;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
} 