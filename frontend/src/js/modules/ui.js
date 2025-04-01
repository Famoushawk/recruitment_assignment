// UI utility functions
export function showNotification(message, type = 'info') {
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

export function showErrorMessage(message) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function highlightMatches(text, searchTerm) {
    if (!text || !searchTerm) {
        return text;
    }

    // Convert text to string if it isn't already
    text = text.toString();

    // Handle array of search terms
    if (Array.isArray(searchTerm)) {
        return searchTerm.reduce((acc, term) => {
            if (!term || term.trim() === '') {
                return acc;
            }
            const escapedSearchTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
            return acc.replace(regex, '<span class="highlight">$1</span>');
        }, text);
    }

    // Handle single search term
    if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    return text;
}

export function initializeUI() {
    // Add any global UI initialization here
    console.log('UI module initialized');
} 