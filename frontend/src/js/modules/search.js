import { showNotification, showErrorMessage, highlightMatches } from './ui.js';
import { getSelectedFileId } from './fileList.js';
import { createPagination } from './pagination.js';

let searchForm;
let searchFields;
let selectAllCheckbox;
let resultsDiv;
let currentSearchParams = null;

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

    if (!getSelectedFileId()) {
        showErrorMessage('Please select a file before searching.');
        return;
    }

    const selectedFields = Array.from(document.querySelectorAll('input[name="searchFields"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedFields.length === 0) {
        showErrorMessage('Please select at least one column to search.');
        return;
    }

    const searchInput = document.getElementById('searchValue');
    const searchValue = searchInput ? searchInput.value.trim() : '';
    if (!searchValue) {
        showErrorMessage('Please enter a search term.');
        return;
    }

    await performSearch(selectedFields, searchValue);
}

export async function performSearch(fields, value, page = 1) {
    try {
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
        }

        const searchParams = {
            fields: fields,
            value: value,
            page: page,
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
        currentSearchParams = { fields, value };

        // Display results
        if (data.results && data.results.length > 0) {
            displayResults(data.results, data.total_count, value);
            if (data.total_pages > 1) {
                createPagination(data.page, data.total_pages);
            }
        } else {
            showErrorMessage('No results found for your search.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showErrorMessage(`Error performing search: ${error.message}`);
    }
}

function displayResults(results, totalCount, searchTerm) {
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

        // Create header with key information
        const header = document.createElement('div');
        header.className = 'result-header';

        // Prioritize showing product and company information in the header
        const productName = result['Product'] || '';
        const indianCompany = result['IndianCompany'] || result['Indian Company'] || '';
        const foreignCompany = result['ForeignCompany'] || result['Foreign Company'] || '';

        // Create header content
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';

        // Add product name with highlighting
        const productTitle = document.createElement('h3');
        productTitle.innerHTML = productName ? highlightMatches(productName, searchTerm) : 'No Product Name';
        headerContent.appendChild(productTitle);

        // Add company information if available
        if (indianCompany || foreignCompany) {
            const companyInfo = document.createElement('div');
            companyInfo.className = 'company-info';

            if (indianCompany) {
                const indianCompanyDiv = document.createElement('div');
                indianCompanyDiv.className = 'company indian-company';
                indianCompanyDiv.innerHTML = `<span class="company-label">Indian Company:</span> ${highlightMatches(indianCompany, searchTerm)}`;
                companyInfo.appendChild(indianCompanyDiv);
            }

            if (foreignCompany) {
                const foreignCompanyDiv = document.createElement('div');
                foreignCompanyDiv.className = 'company foreign-company';
                foreignCompanyDiv.innerHTML = `<span class="company-label">Foreign Company:</span> ${highlightMatches(foreignCompany, searchTerm)}`;
                companyInfo.appendChild(foreignCompanyDiv);
            }

            headerContent.appendChild(companyInfo);
        }

        header.appendChild(headerContent);

        // Add expand/collapse button
        const expandButton = document.createElement('button');
        expandButton.className = 'btn-expand';
        expandButton.textContent = 'Details';
        expandButton.onclick = () => {
            const details = card.querySelector('.result-details');
            if (details) {
                const isExpanded = details.classList.toggle('expanded');
                expandButton.textContent = isExpanded ? 'Hide' : 'Details';
            }
        };
        header.appendChild(expandButton);

        card.appendChild(header);

        // Create details section
        const details = document.createElement('div');
        details.className = 'result-details';

        // Group fields by category
        const fieldGroups = {
            'Product Information': ['Product', 'HS Code', 'Quantity', 'Unit'],
            'Location Information': ['City', 'Address', 'Port', 'Country'],
            'Business Information': ['IEC', 'CUSH', 'Company', 'Invoice', 'Date'],
            'Financial Information': ['Rate', 'Currency', 'FOB', 'Amount']
        };

        // Create field groups
        Object.entries(fieldGroups).forEach(([groupName, fields]) => {
            const groupFields = Object.entries(result).filter(([key]) => 
                fields.some(field => key.toLowerCase().includes(field.toLowerCase()))
            );

            if (groupFields.length > 0) {
                const group = document.createElement('div');
                group.className = 'field-group';
                group.innerHTML = `<h4>${groupName}</h4>`;

                groupFields.forEach(([key, value]) => {
                    const field = document.createElement('div');
                    field.className = 'field';
                    field.innerHTML = `
                        <span class="field-label">${key}:</span>
                        <span class="field-value">${highlightMatches(value.toString(), searchTerm)}</span>
                    `;
                    group.appendChild(field);
                });

                details.appendChild(group);
            }
        });

        // Add remaining fields that don't fit in any group
        const remainingFields = Object.entries(result).filter(([key]) => 
            !Object.values(fieldGroups).flat().some(field => 
                key.toLowerCase().includes(field.toLowerCase())
            )
        );

        if (remainingFields.length > 0) {
            const otherGroup = document.createElement('div');
            otherGroup.className = 'field-group';
            otherGroup.innerHTML = '<h4>Other Information</h4>';

            remainingFields.forEach(([key, value]) => {
                const field = document.createElement('div');
                field.className = 'field';
                field.innerHTML = `
                    <span class="field-label">${key}:</span>
                    <span class="field-value">${highlightMatches(value.toString(), searchTerm)}</span>
                `;
                otherGroup.appendChild(field);
            });

            details.appendChild(otherGroup);
        }

        card.appendChild(details);
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