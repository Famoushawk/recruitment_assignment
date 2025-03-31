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
    const fileList = document.getElementById('fileList');
    const searchInput = document.getElementById('searchValue');
    const suggestionsList = document.getElementById('suggestionsList');
    let selectedFileId = null;

    // Current page and search params (for pagination)
    let currentPage = 1;
    let currentSearchParams = null;
    let totalPages = 0;

    // Function to clear all columns and reset state
    function clearColumns() {
        searchFields.innerHTML = '<p>No columns available. Please select a file first.</p>';
        document.getElementById('selectAllColumns').checked = false;
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
        fetch('/api/columns/')
            .then(response => response.json())
            .then(data => {
                if (data.columns && data.columns.length > 0) {
                    updateColumnSelectionUI(data.columns);
                    // Update current file display
                    updateCurrentFileDisplay(data.current_file);
                } else {
                    clearColumns();
                    searchFields.innerHTML = '<div class="no-columns-message">No columns available. Please upload a CSV file.</div>';
                    selectAllCheckbox.disabled = true;
                    // Hide file info when no columns
                    document.getElementById('currentFileInfo').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error loading columns:', error);
                clearColumns();
                searchFields.innerHTML = '<div class="no-columns-message">Error loading columns. Please try refreshing the page.</div>';
                selectAllCheckbox.disabled = true;
                // Hide file info on error
                document.getElementById('currentFileInfo').style.display = 'none';
            });
    }

    // Function to update current file display
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

    // Set up search suggestions
    let suggestionsTimer = null;
    let currentSuggestions = [];

    // Function to fetch search suggestions
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

    // Handle input changes with debounce
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();

        // Clear previous timer
        if (suggestionsTimer) {
            clearTimeout(suggestionsTimer);
        }

        // Set new timer for debounce (300ms)
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
    searchInput.addEventListener('keydown', (e) => {
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
    });

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

            // Create a priority section for frequently used columns
            const priorityContainer = document.createElement('div');
            priorityContainer.className = 'priority-columns';
            priorityContainer.innerHTML = '<h4>Frequently Searched Columns</h4>';

            // Create a list container for regular columns
            const columnsList = document.createElement('div');
            columnsList.className = 'regular-columns';
            columnsList.innerHTML = '<h4>Other Columns</h4>';

            // Track if we found priority columns
            let foundPriorityColumns = false;

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
                        // Add to priority section and auto-check the box
                        priorityContainer.appendChild(checkbox);
                        // Find the checkbox input and check it
                        const input = checkbox.querySelector('input[type="checkbox"]');
                        if (input) {
                            input.checked = true;
                        }
                        foundPriorityColumns = true;
                    } else {
                        // Add to regular section
                        columnsList.appendChild(checkbox);
                    }
                }
            });

            // Add sections to the page
            if (foundPriorityColumns) {
                searchFields.appendChild(priorityContainer);

                // Add quick search buttons for priority columns
                const quickSearchContainer = document.createElement('div');
                quickSearchContainer.className = 'quick-search-buttons';

                const quickSearchLabel = document.createElement('div');
                quickSearchLabel.className = 'quick-search-label';
                quickSearchLabel.textContent = 'Quick Search:';
                quickSearchContainer.appendChild(quickSearchLabel);

                const btnContainer = document.createElement('div');
                btnContainer.className = 'quick-search-btn-container';

                // Add buttons for each priority type
                const quickSearchTypes = [
                    { name: 'Product', columns: ['product'] },
                    { name: 'Companies', columns: ['indiancompany', 'foreigncompany'] },
                    { name: 'All', columns: priorityColumns }
                ];

                quickSearchTypes.forEach(type => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'quick-search-btn';
                    btn.textContent = type.name;
                    btn.addEventListener('click', () => {
                        // Uncheck all boxes first
                        const allCheckboxes = searchFields.querySelectorAll('input[type="checkbox"]');
                        allCheckboxes.forEach(cb => cb.checked = false);

                        // Check only the relevant columns
                        type.columns.forEach(colName => {
                            // Find checkboxes that match (case-insensitive)
                            parsedColumns.forEach(colLabel => {
                                if (colLabel.toLowerCase().replace(/\s+/g, '') === colName) {
                                    const input = document.querySelector(`#column-${colLabel.trim().replace(/\s+/g, '-')}`);
                                    if (input) input.checked = true;
                                }
                            });
                        });

                        updateSelectAllState();
                    });
                    btnContainer.appendChild(btn);
                });

                quickSearchContainer.appendChild(btnContainer);
                searchFields.appendChild(quickSearchContainer);
            }

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

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Function to format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Function to check if a file is selected
    function isFileSelected() {
        return selectedFileId !== null;
    }

    // Function to perform search
    async function performSearch(fields, value, page = 1) {
        try {
            if (resultsDiv) {
                resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
            }

            const searchParams = {
                fields: fields,
                value: value,
                page: page,
                page_size: 20,
                file_id: selectedFileId
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
                displayResults(data.results, data.total_count);
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

    // Global functions that need to be accessible from HTML
    window.selectFile = async function(fileId) {
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
            console.log('Selected file ID:', selectedFileId); // Debug log

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

            // Load columns for the selected file
            if (data.columns && data.columns.length > 0) {
                updateColumnSelectionUI(data.columns);
                // Update current file display
                updateCurrentFileDisplay(data.filename);
            } else {
                clearColumns();
                if (searchFields) {
                    searchFields.innerHTML = '<div class="no-columns-message">No columns available for this file.</div>';
                }
            }

            // Clear any existing search results
            if (resultsDiv) {
                resultsDiv.innerHTML = '';
            }
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }

            showNotification('File selected successfully', 'success');
        } catch (error) {
            console.error('Error selecting file:', error);
            showNotification(error.message, 'error');
            selectedFileId = null;
        }
    };

    window.deleteFile = async function(fileId, fileName) {
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

            // Reload the file list
            await loadFileList();
            showNotification('File deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting file:', error);
            showNotification('Error deleting file. Please try again.', 'error');
        }
    };

    // Function to load and display file list
    async function loadFileList() {
        try {
            const response = await fetch('/api/files/');
            const data = await response.json();

            const fileList = document.getElementById('fileList');
            if (data.files && data.files.length > 0) {
                fileList.innerHTML = '';
                data.files.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = `file-item${file.is_active ? ' active' : ''}`;
                    fileItem.dataset.fileId = file.id;

                    fileItem.innerHTML = `
                        <div class="file-info">
                            <div class="file-name">${file.filename}</div>
                            <div class="file-details">
                                Uploaded: ${new Date(file.upload_date).toLocaleString()} | Rows: ${file.row_count.toLocaleString()}
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn-select-file" onclick="selectFile(${file.id})">
                                ${file.is_active ? 'Selected' : 'Select'}
                            </button>
                            <button class="btn-delete-file" onclick="deleteFile(${file.id}, '${file.filename}')">
                                Delete
                            </button>
                        </div>
                    `;

                    fileList.appendChild(fileItem);
                });
            } else {
                fileList.innerHTML = '<div class="no-files-message">No files uploaded yet.</div>';
            }
        } catch (error) {
            console.error('Error loading file list:', error);
            fileList.innerHTML = '<div class="no-files-message">Error loading files. Please try again.</div>';
        }
    }

    // Load file list when page loads
    loadFileList();

    // Update file list after successful upload
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

            // Reload file list
            await loadFileList();

            // Select the newly uploaded file
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

    // Update upload button click handler
    uploadButton.removeEventListener('click', handleFileUpload);
    uploadButton.addEventListener('click', handleFileUpload);

    // Event listener for search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!isFileSelected()) {
                showErrorMessage('Please select a file before searching.');
                return;
            }

            const selectedFields = Array.from(document.querySelectorAll('input[name="searchFields"]:checked'))
                .map(checkbox => checkbox.value);

            if (selectedFields.length === 0) {
                showErrorMessage('Please select at least one column to search.');
                return;
            }

            const searchValue = searchInput ? searchInput.value.trim() : '';
            if (!searchValue) {
                showErrorMessage('Please enter a search term.');
                return;
            }

            // Use the performSearch function
            await performSearch(selectedFields, searchValue);
        });
    }

    // Handle suggestions
    if (searchInput && suggestionsList) {
        let suggestionsTimer = null;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();

            if (suggestionsTimer) {
                clearTimeout(suggestionsTimer);
            }

            if (!isFileSelected()) {
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
    }

    // Highlight matches in text
    function highlightMatches(text, searchTerm) {
        if (!text || !searchTerm || searchTerm.trim() === '') {
            return text;
        }

        // Escape special characters in the search term for regex
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create a regex that's case insensitive
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

        // Replace matches with highlighted version
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function displayResults(results, totalCount) {
        if (!resultsDiv) return;

        if (!results || results.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }

        const searchTerm = searchInput ? searchInput.value.trim() : '';

        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-list';

        // Add result count
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.textContent = `Found ${totalCount} result${totalCount !== 1 ? 's' : ''}`;
        resultsContainer.appendChild(resultCount);

        // Add each result as a card
        results.forEach((result, index) => {
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
            const actionButtons = document.createElement('div');
            actionButtons.className = 'result-actions';
            actionButtons.innerHTML = `
                <button class="btn-expand" onclick="toggleResultDetails(${index})">
                    Details
                </button>
            `;
            header.appendChild(actionButtons);
            card.appendChild(header);

            // Create details section
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

            // Create field groups
            fieldGroups.forEach(group => {
                const groupExists = group.fields.some(field => result[field] !== undefined && result[field] !== '');

                if (groupExists) {
                    const fieldGroup = document.createElement('div');
                    fieldGroup.className = 'field-group';

                    const groupTitle = document.createElement('h4');
                    groupTitle.textContent = group.title;
                    fieldGroup.appendChild(groupTitle);

                    const fieldsGrid = document.createElement('div');
                    fieldsGrid.className = 'fields-grid';

                    group.fields.forEach(field => {
                        if (result[field] !== undefined && result[field] !== '') {
                            const fieldItem = document.createElement('div');
                            fieldItem.className = 'field-item';

                            const fieldLabel = document.createElement('div');
                            fieldLabel.className = 'field-label';
                            fieldLabel.textContent = formatColumnName(field);

                            const fieldValue = document.createElement('div');
                            fieldValue.className = 'field-value';
                            fieldValue.innerHTML = highlightMatches(String(result[field]), searchTerm);

                            fieldItem.appendChild(fieldLabel);
                            fieldItem.appendChild(fieldValue);
                            fieldsGrid.appendChild(fieldItem);
                        }
                    });

                    fieldGroup.appendChild(fieldsGrid);
                    details.appendChild(fieldGroup);
                }
            });

            // Add remaining fields that weren't in any group
            const remainingFields = Object.keys(result).filter(field => 
                !fieldGroups.some(group => group.fields.includes(field)) &&
                field !== '_relevance' // Exclude the relevance score
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
                    if (result[field] !== undefined && result[field] !== '') {
                        const fieldItem = document.createElement('div');
                        fieldItem.className = 'field-item';

                        const fieldLabel = document.createElement('div');
                        fieldLabel.className = 'field-label';
                        fieldLabel.textContent = formatColumnName(field);

                        const fieldValue = document.createElement('div');
                        fieldValue.className = 'field-value';
                        fieldValue.innerHTML = highlightMatches(String(result[field]), searchTerm);

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

        // Clear previous results and add new ones
        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(resultsContainer);

        // Add toggle function if it doesn't exist
        if (!window.toggleResultDetails) {
            window.toggleResultDetails = function(index) {
                const details = document.getElementById(`result-details-${index}`);
                if (details) {
                    details.classList.toggle('expanded');
                    const button = event.currentTarget;
                    button.textContent = details.classList.contains('expanded') ? 'Hide' : 'Details';
                }
            };
        }
    }

    // Function to show error message
    function showErrorMessage(message) {
        if (resultsDiv) {
            resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }
});