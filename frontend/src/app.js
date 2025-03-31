document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const searchFields = document.getElementById('searchFields');
    const selectAllCheckbox = document.getElementById('selectAllColumns');
    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const paginationContainer = document.getElementById('paginationContainer');

    // Current page and search params (for pagination)
    let currentPage = 1;
    let currentSearchParams = null;
    let totalPages = 0;

    // Function to clear all columns and reset state
    function clearColumns() {
        searchFields.innerHTML = '';
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = true;
        resultsDiv.innerHTML = '';
    }

    // Function to format column name for display
    function formatColumnName(column) {
        return column.trim()
            .split(/[.]|(?=[A-Z])|_/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    }

    // Function to create a checkbox for a column
    function createColumnCheckbox(column) {
        // Create a div container for each checkbox (forces vertical layout)
        const div = document.createElement('div');
        div.style.display = 'block';
        div.style.width = '100%';
        div.style.marginBottom = '8px';

        const label = document.createElement('label');
        label.className = 'checkbox-container';
        label.style.display = 'flex';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = column.trim(); // Ensure we trim any whitespace
        checkbox.name = 'searchFields';
        checkbox.id = `column-${column.trim().replace(/\s+/g, '-')}`;

        const span = document.createElement('span');
        span.className = 'checkbox-label';

        // Format the column name for display
        const displayName = formatColumnName(column);
        span.textContent = displayName;

        label.appendChild(checkbox);
        label.appendChild(span);
        div.appendChild(label);

        return div;
    }

    // Function to parse columns - handle both array and semicolon-separated string
    function parseColumns(columns) {
        if (!columns) return [];

        // If columns is already an array, return it after trimming each item
        if (Array.isArray(columns)) {
            return columns.map(col => col.trim()).filter(col => col);
        }

        // If it's a string, split by semicolon
        if (typeof columns === 'string') {
            return columns.split(';').map(col => col.trim()).filter(col => col);
        }

        return [];
    }

    // Handle "Select All" checkbox
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = searchFields.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });

    // Update "Select All" checkbox state based on individual checkboxes
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

    // Add event delegation for checkbox changes
    searchFields.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateSelectAllState();
        }
    });

    // Load columns function
    function loadColumns() {
        // Don't automatically fetch columns on page load
        clearColumns();
        searchFields.innerHTML = '<div class="no-columns-message">No columns available. Please upload a CSV file.</div>';
        selectAllCheckbox.disabled = true;
    }

    // Create pagination controls
    function createPagination(currentPage, totalPages) {
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        const pagination = document.createElement('div');
        pagination.className = 'pagination';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                navigateToPage(currentPage - 1);
            }
        });
        pagination.appendChild(prevButton);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page button (if not already included)
        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.textContent = '1';
            firstPageBtn.className = 'pagination-btn';
            firstPageBtn.addEventListener('click', () => navigateToPage(1));
            pagination.appendChild(firstPageBtn);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                pagination.appendChild(ellipsis);
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'pagination-btn active' : 'pagination-btn';
            pageBtn.addEventListener('click', () => navigateToPage(i));
            pagination.appendChild(pageBtn);
        }

        // Last page button (if not already included)
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                pagination.appendChild(ellipsis);
            }

            const lastPageBtn = document.createElement('button');
            lastPageBtn.textContent = totalPages;
            lastPageBtn.className = 'pagination-btn';
            lastPageBtn.addEventListener('click', () => navigateToPage(totalPages));
            pagination.appendChild(lastPageBtn);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                navigateToPage(currentPage + 1);
            }
        });
        pagination.appendChild(nextButton);

        paginationContainer.appendChild(pagination);
    }

    // Function to navigate to a specific page
    function navigateToPage(page) {
        if (currentSearchParams) {
            currentPage = page;
            performSearch(currentSearchParams.fields, currentSearchParams.value, page);
        }
    }

    // Load columns initial state when page loads
    loadColumns();

    // Check progress of file upload
    let progressInterval = null;
    function checkUploadProgress() {
        fetch('/api/upload-progress/')
            .then(response => response.json())
            .then(data => {
                // Update progress UI
                if (data.status === 'in_progress') {
                    progressContainer.style.display = 'block';
                    const percent = data.total_rows > 0
                        ? Math.round((data.processed_rows / data.total_rows) * 100)
                        : 0;
                    progressBar.style.width = `${percent}%`;
                    progressBar.setAttribute('aria-valuenow', percent);
                    progressText.textContent = `${percent}% (${data.processed_rows} of ${data.total_rows} rows)`;
                    progressStatus.textContent = 'Processing...';

                    // If columns are available, update UI
                    if (data.columns && data.columns.length > 0) {
                        updateColumnSelectionUI(data.columns);
                    }
                }
                else if (data.status === 'completed') {
                    progressBar.style.width = '100%';
                    progressBar.setAttribute('aria-valuenow', 100);
                    progressText.textContent = `100% (${data.processed_rows} rows processed)`;
                    progressStatus.textContent = 'Completed';

                    // Clear interval and update UI
                    clearInterval(progressInterval);
                    progressInterval = null;

                    // Fade out progress after 3 seconds
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                    }, 3000);

                    // Update column selection UI
                    if (data.columns && data.columns.length > 0) {
                        updateColumnSelectionUI(data.columns);
                    }

                    // Show success notification
                    showNotification('File processed successfully!', 'success');
                }
                else if (data.status === 'error') {
                    progressStatus.textContent = `Error: ${data.error}`;
                    progressStatus.classList.add('text-danger');

                    // Clear interval
                    clearInterval(progressInterval);
                    progressInterval = null;

                    // Show error notification
                    showNotification(`Error processing file: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error checking progress:', error);
                progressStatus.textContent = 'Error checking progress';
                progressStatus.classList.add('text-danger');

                // Clear interval on error
                clearInterval(progressInterval);
                progressInterval = null;
            });
    }

    // Update column selection UI
    function updateColumnSelectionUI(columns) {
        // Process columns
        const parsedColumns = parseColumns(columns);

        if (parsedColumns.length > 0) {
            searchFields.innerHTML = '';

            // Create a list container
            const columnsList = document.createElement('div');
            columnsList.style.display = 'flex';
            columnsList.style.flexDirection = 'column';
            columnsList.style.width = '100%';

            // Add each column as a checkbox
            parsedColumns.forEach(column => {
                if (column && column.trim()) {
                    const checkbox = createColumnCheckbox(column);
                    columnsList.appendChild(checkbox);
                }
            });

            searchFields.appendChild(columnsList);
            selectAllCheckbox.disabled = false;
            updateSelectAllState();
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    // Upload form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            showNotification('Please select a file to upload', 'error');
            return;
        }

        // Check if file is a CSV
        if (!file.name.endsWith('.csv')) {
            showNotification('Please upload a CSV file', 'error');
            return;
        }

        // Check file size (warn if larger than 50MB)
        const MAX_SIZE_WARNING = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_SIZE_WARNING) {
            const confirmUpload = confirm(`The file is ${(file.size / (1024 * 1024)).toFixed(2)}MB, which is quite large. Processing may take some time. Continue?`);
            if (!confirmUpload) {
                return;
            }
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Reset progress UI
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
            progressText.textContent = '0%';
            progressStatus.textContent = 'Starting...';
            progressStatus.classList.remove('text-danger');

            // Display upload starting message
            showNotification('Starting file upload...', 'info');

            // Submit the file
            const response = await fetch('/api/upload/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            console.log("Upload response:", data);

            // Show progress UI
            progressContainer.style.display = 'block';

            // Start progress checking
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            progressInterval = setInterval(checkUploadProgress, 1000);

            // Clear file input
            fileInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error uploading file: ${error.message}`, 'error');
            clearColumns();
        }
    });

    // Perform search with pagination
    async function performSearch(fields, value, page = 1, pageSize = 20) {
        try {
            // Show loading state
            resultsDiv.innerHTML = '<div class="loading-spinner">Loading results...</div>';

            console.log("Search request:", { fields, value, page, page_size: pageSize });

            const response = await fetch('/api/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fields,
                    value,
                    page,
                    page_size: pageSize
                })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            console.log("Search response:", data);

            // Update pagination state
            currentPage = data.page;
            totalPages = data.total_pages;

            // Display results
            displayResults(data.results, data.total_count);

            // Update pagination UI
            createPagination(currentPage, totalPages);
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error performing search: ${error.message}`, 'error');
            resultsDiv.innerHTML = '<div class="error-message">Error performing search. Please try again.</div>';
        }
    }

    // Search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchValue = document.getElementById('searchValue').value;
        const selectedFields = Array.from(searchFields.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedFields.length === 0) {
            showNotification('Please select at least one column to search', 'warning');
            return;
        }

        // Store current search params for pagination
        currentSearchParams = {
            fields: selectedFields,
            value: searchValue
        };

        // Reset to first page
        currentPage = 1;

        // Perform search
        await performSearch(selectedFields, searchValue, currentPage);
    });

    // Export results button
    document.getElementById('exportResultsBtn').addEventListener('click', () => {
        if (!currentSearchParams) {
            showNotification('Please perform a search first', 'warning');
            return;
        }

        const { fields, value } = currentSearchParams;
        const queryParams = new URLSearchParams();
        fields.forEach(field => queryParams.append('fields', field));
        queryParams.append('value', value);

        // Redirect to download endpoint
        window.location.href = `/api/download-results/?${queryParams.toString()}`;
    });

    function displayResults(data, totalCount) {
        if (!data || data.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            paginationContainer.innerHTML = '';
            return;
        }

        // Create a card-based layout for results
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';

        // Add result count summary
        const resultSummary = document.createElement('div');
        resultSummary.className = 'result-summary';
        resultSummary.textContent = `Found ${totalCount} result${totalCount !== 1 ? 's' : ''} (showing ${data.length})`;
        resultsContainer.appendChild(resultSummary);

        // Add each result as a card
        data.forEach((row, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';

            // Create header with key information
            const header = document.createElement('div');
            header.className = 'result-header';

            // Try to find the most important fields to show in the header
            const productName = row['Product'] || '';
            const itemNo = row['Item No'] || '';
            header.innerHTML = `
                <h3>${productName} ${itemNo ? `<span class="item-number">Item #${itemNo}</span>` : ''}</h3>
                <div class="result-actions">
                    <button class="btn-expand" onclick="toggleResultDetails(${index})">Details</button>
                </div>
            `;
            card.appendChild(header);

            // Create the details section with all data in a clean grid layout
            const details = document.createElement('div');
            details.className = 'result-details';
            details.id = `result-details-${index}`;

            // Group similar fields together
            const fieldGroups = [
                { title: 'Product Information', fields: ['Product', 'H S Code', 'Quantity', 'Unit'] },
                { title: 'Location Information', fields: ['City', 'Address1', 'Address2', 'Indian Port', 'Foreign Port', 'Foreign Country'] },
                { title: 'Business Information', fields: ['I E C', 'C U S H', 'Indian Company', 'Foreign Company', 'Invoice No', 'Date'] },
                { title: 'Financial Information', fields: ['Item Rate I N V', 'Currency', 'F O B I N R', 'Total Amount'] }
            ];

            fieldGroups.forEach(group => {
                const groupExists = group.fields.some(field => row[field] !== undefined && row[field] !== '');

                if (groupExists) {
                    const fieldGroup = document.createElement('div');
                    fieldGroup.className = 'field-group';

                    const groupTitle = document.createElement('h4');
                    groupTitle.textContent = group.title;
                    fieldGroup.appendChild(groupTitle);

                    const fieldsGrid = document.createElement('div');
                    fieldsGrid.className = 'fields-grid';

                    group.fields.forEach(field => {
                        if (row[field] !== undefined && row[field] !== '') {
                            const fieldItem = document.createElement('div');
                            fieldItem.className = 'field-item';

                            const fieldLabel = document.createElement('div');
                            fieldLabel.className = 'field-label';
                            fieldLabel.textContent = formatColumnName(field);

                            const fieldValue = document.createElement('div');
                            fieldValue.className = 'field-value';
                            fieldValue.textContent = row[field];

                            fieldItem.appendChild(fieldLabel);
                            fieldItem.appendChild(fieldValue);
                            fieldsGrid.appendChild(fieldItem);
                        }
                    });

                    fieldGroup.appendChild(fieldsGrid);
                    details.appendChild(fieldGroup);
                }
            });

            // Add a section for any fields that weren't in the predefined groups
            const remainingFields = Object.keys(row).filter(field =>
                !fieldGroups.some(group => group.fields.includes(field))
            );

            if (remainingFields.length > 0) {
                const otherGroup = document.createElement('div');
                otherGroup.className = 'field-group';

                const groupTitle = document.createElement('h4');
                groupTitle.textContent = 'Other Information';
                otherGroup.appendChild(groupTitle);

                const fieldsGrid = document.createElement('div');
                fieldsGrid.className = 'fields-grid';

                remainingFields.forEach(field => {
                    if (row[field] !== undefined && row[field] !== '') {
                        const fieldItem = document.createElement('div');
                        fieldItem.className = 'field-item';

                        const fieldLabel = document.createElement('div');
                        fieldLabel.className = 'field-label';
                        fieldLabel.textContent = formatColumnName(field);

                        const fieldValue = document.createElement('div');
                        fieldValue.className = 'field-value';
                        fieldValue.textContent = row[field];

                        fieldItem.appendChild(fieldLabel);
                        fieldItem.appendChild(fieldValue);
                        fieldsGrid.appendChild(fieldItem);
                    }
                });

                otherGroup.appendChild(fieldsGrid);
                details.appendChild(otherGroup);
            }

            card.appendChild(details);
            resultsContainer.appendChild(card);
        });

        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(resultsContainer);

        // Add script to handle expanding/collapsing details
        if (!window.toggleResultDetails) {
            const script = document.createElement('script');
            script.textContent = `
                function toggleResultDetails(index) {
                    const details = document.getElementById('result-details-' + index);
                    if (details) {
                        details.classList.toggle('expanded');
                        const button = event.currentTarget;
                        button.textContent = details.classList.contains('expanded') ? 'Hide' : 'Details';
                    }
                }
            `;
            document.body.appendChild(script);
        }
    }
});