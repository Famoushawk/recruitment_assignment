document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const searchField = document.getElementById('searchField');

    // Function to populate column dropdown
    async function loadColumns() {
        try {
            const response = await fetch('/api/columns/');
            if (!response.ok) {
                throw new Error('Failed to fetch columns');
            }
            const data = await response.json();
            
            // Clear existing options except the first one
            searchField.innerHTML = '<option value="">Select a column...</option>';
            
            // Add new options
            data.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                searchField.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Load columns when page loads
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
            
            // Update column dropdown with new columns
            searchField.innerHTML = '<option value="">Select a column...</option>';
            data.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                searchField.appendChild(option);
            });

            alert('File uploaded successfully!');
            fileInput.value = ''; // Clear the file input
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading file');
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchField = document.getElementById('searchField').value;
        const searchValue = document.getElementById('searchValue').value;

        if (!searchField) {
            alert('Please select a column to search');
            return;
        }

        try {
            const response = await fetch('/api/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field: searchField,
                    value: searchValue
                })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Error performing search');
        }
    });

    function displayResults(data) {
        if (!data || data.length === 0) {
            resultsDiv.innerHTML = '<p>No results found</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        `;

        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(table);
    }
}); 