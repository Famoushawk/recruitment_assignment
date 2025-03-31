import { showNotification, showErrorMessage, highlightMatches } from './ui.js';
import { getSelectedFileId } from './fileList.js';
import { createPagination, updatePagination } from './pagination.js';
import { getSuggestions } from './suggestions.js';

let searchForm;
let searchFields;
let selectAllCheckbox;
let resultsDiv;
let currentSearchParams = null;
let currentPage = 1;
let totalPages = 0;

export function initializeSearch() {
    searchForm = document.getElementById('searchForm');
    searchFields = document.getElementById('searchFields');
    selectAllCheckbox = document.getElementById('selectAllColumns');
    resultsDiv = document.getElementById('results');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

    if (searchFields) {
        searchFields.addEventListener('change', handleFieldChange);
    }

    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }

    // Handle search input changes for suggestions
    const searchInput = document.getElementById('searchValue');
    searchInput.addEventListener('input', async (e) => {
        const value = e.target.value.trim();
        if (value) {
            const suggestions = await getSuggestions(value);
            displaySuggestions(suggestions);
        } else {
            hideSuggestions();
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target)) {
            hideSuggestions();
        }
    });

    // Handle suggestion selection
    document.getElementById('suggestionsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-item')) {
            // Extract just the search term without the column info in parentheses
            const searchTerm = e.target.textContent.replace(/\s*\([^)]*\)\s*$/, '');
            searchInput.value = searchTerm;
            hideSuggestions();
            performSearch();
        }
    });
}

function handleSelectAll(e) {
    const checkboxes = searchFields.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
}

function handleFieldChange(e) {
    if (e.target.type === 'checkbox') {
        updateSelectAllState();
    }
}

function updateSelectAllState() {
    const checkboxes = searchFields.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = searchFields.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = true;
    } else {
        selectAllCheckbox.checked = checkboxes.length === checkedBoxes.length;
        selectAllCheckbox.disabled = false;
    }
}

async function handleSearchSubmit(e) {
    e.preventDefault();
    await performSearch();
}

export async function performSearch(page = 1) {
    const searchValue = document.getElementById('searchValue').value.trim();
    const searchFields = document.getElementById('searchFields');
    const selectedFields = Array.from(searchFields.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => {
            // Convert field names to match database columns
            const field = checkbox.value;
            switch(field) {
                case 'ForeignCompany':
                    return 'Foreign Company';
                case 'IndianCompany':
                    return 'Indian Company';
                default:
                    return field;
            }
        });

    if (!searchValue) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    if (selectedFields.length === 0) {
        showNotification('Please select at least one field to search in', 'warning');
        return;
    }

    // Split search terms by comma and trim whitespace
    const searchTerms = searchValue.split(',')
        .map(term => term.trim())
        .filter(term => term.length > 0);  // Only keep non-empty terms

    if (searchTerms.length === 0) {
        showNotification('Please enter at least one valid search term', 'warning');
        return;
    }

    try {
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
        }

        currentPage = page;  // Update current page

        const searchParams = {
            search_terms: searchTerms,
            fields: selectedFields,
            page: currentPage,
            page_size: 20,
            file_id: getSelectedFileId()
        };

        console.log('Search request:', searchParams);

        const response = await fetch('/api/search/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchParams)
        });

        const data = await response.json();
        console.log('Search response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }

        // Store current search parameters for pagination
        currentSearchParams = { search_terms: searchTerms, fields: selectedFields };

        // Display results
        if (data.results && data.results.length > 0) {
            displayResults(data.results, data.total_count, searchTerms);
            if (data.total_pages > 1) {
                totalPages = data.total_pages;
                createPagination(currentPage, totalPages);
            }
        } else {
            showErrorMessage('No results found for your search.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showErrorMessage(`Error performing search: ${error.message}`);
    }
}

function displayResults(results, totalCount, searchTerms) {
    if (!resultsDiv) return;

    // Show total count
    resultsDiv.innerHTML = `
        <div class="result-count">
            Found ${totalCount} result${totalCount !== 1 ? 's' : ''}
        </div>
    `;

    // Add each result as a card
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';

        // Get the actual data from the result object
        const data = result.data || {};

        // Create header with key information
        const header = document.createElement('div');
        header.className = 'result-header';

        // Prioritize showing product and company information in the header
        const productName = data['Product'] || data['product'] || '';
        const indianCompany = data['Indian Company'] || data['IndianCompany'] || '';
        const foreignCompany = data['Foreign Company'] || data['ForeignCompany'] || '';

        // Create header content
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';

        // Add product name with highlighting for each search term
        const productTitle = document.createElement('h3');
        let highlightedProduct = productName;
        searchTerms.forEach(term => {
            highlightedProduct = highlightMatches(highlightedProduct, term);
        });
        productTitle.innerHTML = productName ? highlightedProduct : 'No Product Name';
        headerContent.appendChild(productTitle);

        // Add company information if available
        if (indianCompany || foreignCompany) {
            const companyInfo = document.createElement('div');
            companyInfo.className = 'company-info';

            if (indianCompany) {
                const indianCompanyDiv = document.createElement('div');
                indianCompanyDiv.className = 'company indian-company';
                let highlightedIndianCompany = indianCompany;
                searchTerms.forEach(term => {
                    highlightedIndianCompany = highlightMatches(highlightedIndianCompany, term);
                });
                indianCompanyDiv.innerHTML = `<span class="company-label">Indian Company:</span> ${highlightedIndianCompany}`;
                companyInfo.appendChild(indianCompanyDiv);
            }

            if (foreignCompany) {
                const foreignCompanyDiv = document.createElement('div');
                foreignCompanyDiv.className = 'company foreign-company';
                let highlightedForeignCompany = foreignCompany;
                searchTerms.forEach(term => {
                    highlightedForeignCompany = highlightMatches(highlightedForeignCompany, term);
                });
                foreignCompanyDiv.innerHTML = `<span class="company-label">Foreign Company:</span> ${highlightedForeignCompany}`;
                companyInfo.appendChild(foreignCompanyDiv);
            }

            headerContent.appendChild(companyInfo);
        }

        header.appendChild(headerContent);
        card.appendChild(header);
        resultsDiv.appendChild(card);
    });
}

export function updateColumnSelectionUI(columns) {
    if (!searchFields) return;

    // Process columns
    const parsedColumns = parseColumns(columns);

    if (parsedColumns.length > 0) {
        searchFields.innerHTML = '';

        // Create a priority section for frequently used columns
        const priorityContainer = document.createElement('div');
        priorityContainer.className = 'priority-columns';
        priorityContainer.innerHTML = '<h4>Frequently Searched Columns</h4>';

        // Create a list container for regular columns
        const columnsList = document.createElement('div');
        columnsList.className = 'regular-columns';
        columnsList.innerHTML = '<h4>Other Columns</h4>';

        // Common search columns (case-insensitive matching)
        const priorityColumns = ['product', 'indiancompany', 'foreigncompany'];

        // Sort columns so priority ones appear first
        const sortedColumns = [...parsedColumns].sort((a, b) => {
            const aIsPriority = priorityColumns.includes(a.toLowerCase().replace(/\s+/g, ''));
            const bIsPriority = priorityColumns.includes(b.toLowerCase().replace(/\s+/g, ''));

            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            return a.localeCompare(b);
        });

        // Add each column as a checkbox
        sortedColumns.forEach(column => {
            if (column && column.trim()) {
                const checkbox = createColumnCheckbox(column);

                // Check if this is a priority column (case-insensitive match)
                const normalizedColumn = column.toLowerCase().replace(/\s+/g, '');
                const isPriorityColumn = priorityColumns.includes(normalizedColumn);

                if (isPriorityColumn) {
                    priorityContainer.appendChild(checkbox);
                    const input = checkbox.querySelector('input[type="checkbox"]');
                    if (input) {
                        input.checked = true;
                    }
                } else {
                    columnsList.appendChild(checkbox);
                }
            }
        });

        searchFields.appendChild(priorityContainer);
        searchFields.appendChild(columnsList);
        selectAllCheckbox.disabled = false;
        updateSelectAllState();
    }
}

function parseColumns(columns) {
    if (!columns) return [];

    if (Array.isArray(columns)) {
        return columns.map(col => col.trim()).filter(col => col);
    }

    if (typeof columns === 'string') {
        return columns.split(';').map(col => col.trim()).filter(col => col);
    }

    return [];
}

function createColumnCheckbox(column) {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.width = '100%';
    div.style.marginBottom = '8px';

    const label = document.createElement('label');
    label.className = 'checkbox-container';
    label.style.display = 'flex';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = column.trim();
    checkbox.name = 'searchFields';
    checkbox.id = `column-${column.trim().replace(/\s+/g, '-')}`;

    const span = document.createElement('span');
    span.className = 'checkbox-label';
    span.textContent = formatColumnName(column);

    label.appendChild(checkbox);
    label.appendChild(span);
    div.appendChild(label);

    return div;
}

function formatColumnName(column) {
    return column.trim()
        .split(/[.]|(?=[A-Z])|_/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
}

export function getCurrentSearchParams() {
    return currentSearchParams;
}

function displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';
    
    if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                // Extract just the search term without the column info in parentheses
                const searchTerm = suggestion.replace(/\s*\([^)]*\)\s*$/, '');
                document.getElementById('searchValue').value = searchTerm;
                hideSuggestions();
                performSearch();
            });
            suggestionsList.appendChild(div);
        });
        suggestionsList.style.display = 'block';
    } else {
        hideSuggestions();
    }
}

function hideSuggestions() {
    document.getElementById('suggestionsList').style.display = 'none';
} 