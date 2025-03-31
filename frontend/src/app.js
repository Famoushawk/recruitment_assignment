document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const searchFields = document.getElementById('searchFields');
    const selectAllCheckbox = document.getElementById('selectAllColumns');

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
        checkbox.id = `column-${column.trim()}`;

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

    // Modified loadColumns function to only show a message initially
    function loadColumns() {
        // Don't automatically fetch columns on page load
        clearColumns();
        searchFields.innerHTML = '<div class="no-columns-message">No columns available. Please upload a CSV file.</div>';
        selectAllCheckbox.disabled = true;
    }

    // Load columns initial state when page loads
    loadColumns();

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to upload');
            return;
        }

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
            console.log("Upload response:", data); // Debug: log response

            // Clear existing state
            clearColumns();

            // Process columns (handle both array and string formats)
            const parsedColumns = parseColumns(data.columns);

            if (parsedColumns.length > 0) {
                // Create a list container with forced column layout
                const columnsList = document.createElement('div');
                columnsList.style.display = 'flex';
                columnsList.style.flexDirection = 'column';
                columnsList.style.width = '100%';

                // Add each column as a separate checkbox
                parsedColumns.forEach(column => {
                    if (column && column.trim()) { // Skip empty columns
                        const checkbox = createColumnCheckbox(column);
                        columnsList.appendChild(checkbox);
                    }
                });

                searchFields.appendChild(columnsList);
                selectAllCheckbox.disabled = false;
            } else {
                searchFields.innerHTML = '<div class="no-columns-message">No columns available in uploaded file.</div>';
            }

            alert('File uploaded successfully!');
            fileInput.value = ''; // Clear the file input
            updateSelectAllState();
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading file: ' + error.message);
            clearColumns();
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchValue = document.getElementById('searchValue').value;
        const selectedFields = Array.from(searchFields.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedFields.length === 0) {
            alert('Please select at least one column to search');
            return;
        }

        try {
            console.log("Search request:", { fields: selectedFields, value: searchValue }); // Debug

            const response = await fetch('/api/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fields: selectedFields,
                    value: searchValue
                })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            console.log("Search response:", data); // Debug
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Error performing search: ' + error.message);
        }
    });

    function displayResults(data) {
        if (!data || data.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }

        // Create a card-based layout for results
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';

        // Add result count summary
        const resultSummary = document.createElement('div');
        resultSummary.className = 'result-summary';
        resultSummary.textContent = `Found ${data.length} result${data.length !== 1 ? 's' : ''}`;
        resultsContainer.appendChild(resultSummary);

        // Add each result as a card
        data.forEach((row, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';

            // Create header with key information (adjust these fields as needed for your data)
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

        // Add this script to handle expanding/collapsing details
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
});