import { performSearch } from './search.js';

let paginationContainer;

export function initializePagination() {
    paginationContainer = document.getElementById('paginationContainer');
}

export function createPagination(currentPage, totalPages) {
    if (!paginationContainer || totalPages <= 1) {
        return;
    }

    paginationContainer.innerHTML = '';
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

function navigateToPage(page) {
    const searchParams = getCurrentSearchParams();
    if (searchParams) {
        performSearch(searchParams.fields, searchParams.value, page);
    }
}

// Import search module at the top level
import { getCurrentSearchParams as getSearchParams } from './search.js';

function getCurrentSearchParams() {
    return getSearchParams();
} 