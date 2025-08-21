// Documents JavaScript
// Created by Marwen Deiparine

let currentDocumentsPage = 1;
let currentDocumentsFilters = {
    search: '',
    category: '',
    featured: false
};

// Initialize documents functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDocuments();
});

function initializeDocuments() {
    // Search functionality
    const searchInput = document.getElementById('document-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentDocumentsFilters.search = e.target.value.trim();
            currentDocumentsPage = 1;
            loadDocuments();
        }, 500));
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentDocumentsFilters.category = e.target.value;
            currentDocumentsPage = 1;
            loadDocuments();
        });
    }

    // Featured filter
    const featuredFilter = document.getElementById('featured-filter');
    if (featuredFilter) {
        featuredFilter.addEventListener('click', (e) => {
            currentDocumentsFilters.featured = !currentDocumentsFilters.featured;
            e.target.classList.toggle('active', currentDocumentsFilters.featured);
            currentDocumentsPage = 1;
            loadDocuments();
        });
    }
}

// Load document categories
async function loadDocumentCategories() {
    try {
        const response = await fetch('/api/documents/categories');
        if (!response.ok) return;

        const categories = await response.json();
        
        // Update category filter dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }

        // Update forum category filter
        const forumCategoryFilter = document.getElementById('forum-category-filter');
        if (forumCategoryFilter) {
            // This will be handled by forum.js
        }

        // Display categories grid
        const categoriesGrid = document.getElementById('categories-grid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = categories.map(category => `
                <div class="category-card" onclick="filterByCategory(${category.id})" 
                     style="--category-color: ${category.color}">
                    <div class="category-card-icon">
                        <i class="${category.icon}"></i>
                    </div>
                    <h3>${escapeHtml(category.name)}</h3>
                    <p>${escapeHtml(category.description || '')}</p>
                    <div class="category-count" id="category-count-${category.id}">
                        Loading...
                    </div>
                </div>
            `).join('');

            // Load document counts for each category
            loadCategoryCounts(categories);
        }
    } catch (error) {
        console.error('Load categories error:', error);
        showToast('Error', 'Failed to load document categories.', 'error');
    }
}

// Load document counts for categories
async function loadCategoryCounts(categories) {
    try {
        const promises = categories.map(async (category) => {
            const response = await fetch(`/api/documents?category=${category.id}&limit=1`);
            if (response.ok) {
                const data = await response.json();
                const countElement = document.getElementById(`category-count-${category.id}`);
                if (countElement) {
                    const count = data.pagination.totalCount;
                    countElement.textContent = `${count} document${count !== 1 ? 's' : ''}`;
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Load category counts error:', error);
    }
}

// Filter documents by category
function filterByCategory(categoryId) {
    currentDocumentsFilters.category = categoryId.toString();
    currentDocumentsPage = 1;
    
    // Update filter dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
    }
    
    loadDocuments();
}

// Load documents with current filters
async function loadDocuments(page = 1) {
    currentDocumentsPage = page;
    
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12'
        });

        if (currentDocumentsFilters.search) {
            params.append('search', currentDocumentsFilters.search);
        }
        if (currentDocumentsFilters.category) {
            params.append('category', currentDocumentsFilters.category);
        }
        if (currentDocumentsFilters.featured) {
            params.append('featured', 'true');
        }

        const response = await fetch(`/api/documents?${params}`);
        if (!response.ok) {
            throw new Error('Failed to load documents');
        }

        const data = await response.json();
        displayDocuments(data.documents);
        generatePagination(data.pagination, 'documents-pagination', 'loadDocuments');
        
    } catch (error) {
        console.error('Load documents error:', error);
        showToast('Error', 'Failed to load documents.', 'error');
    } finally {
        hideLoading();
    }
}

// Display documents in grid
function displayDocuments(documents) {
    const container = document.getElementById('documents-grid');
    if (!container) return;

    if (documents.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h3>No documents found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = documents.map(doc => `
        <div class="document-card">
            ${doc.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
            
            <div class="document-header">
                <h3 class="document-title">${escapeHtml(doc.title)}</h3>
                <p class="document-description">${escapeHtml(doc.description || 'No description available')}</p>
            </div>
            
            <div class="document-meta">
                ${doc.category_name ? `
                    <div class="category-badge" style="background-color: ${doc.category_color}20; color: ${doc.category_color}">
                        <i class="${doc.category_icon}"></i>
                        ${escapeHtml(doc.category_name)}
                    </div>
                ` : ''}
                <span><i class="fas fa-download"></i> ${doc.download_count} downloads</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(doc.created_at)}</span>
                ${doc.file_size ? `<span><i class="fas fa-file"></i> ${formatFileSize(doc.file_size)}</span>` : ''}
            </div>
            
            <div class="document-actions">
                <button class="btn btn-primary" onclick="downloadDocument(${doc.id})">
                    <i class="fas fa-download"></i>
                    Download
                </button>
                <button class="btn btn-outline" onclick="viewDocumentDetails(${doc.id})">
                    <i class="fas fa-eye"></i>
                    Details
                </button>
            </div>
        </div>
    `).join('');
}

// Download document
async function downloadDocument(documentId) {
    try {
        showLoading();
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = `/api/documents/${documentId}/download`;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Download Started', 'Your document download has started.', 'success');
        
        // Reload documents to update download count
        setTimeout(() => {
            loadDocuments(currentDocumentsPage);
        }, 1000);
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download Failed', 'Unable to download document. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// View document details
async function viewDocumentDetails(documentId) {
    try {
        showLoading();
        
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
            throw new Error('Failed to load document details');
        }

        const doc = await response.json();
        
        // Create and show document details modal
        showDocumentDetailsModal(doc);
        
    } catch (error) {
        console.error('View details error:', error);
        showToast('Error', 'Failed to load document details.', 'error');
    } finally {
        hideLoading();
    }
}

// Show document details modal
function showDocumentDetailsModal(doc) {
    const modalHTML = `
        <div class="modal-overlay" id="document-details-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Document Details</h2>
                    <button class="modal-close" onclick="closeModal('document-details-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="document-details">
                        ${doc.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured Document</div>' : ''}
                        
                        <h3>${escapeHtml(doc.title)}</h3>
                        <p class="document-description">${escapeHtml(doc.description || 'No description available')}</p>
                        
                        <div class="document-info-grid">
                            <div class="info-item">
                                <label>Category</label>
                                <div class="info-value">
                                    ${doc.category_name ? `
                                        <span class="category-badge" style="background-color: ${doc.category_color}20; color: ${doc.category_color}">
                                            <i class="${doc.category_icon}"></i>
                                            ${escapeHtml(doc.category_name)}
                                        </span>
                                    ` : 'Uncategorized'}
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <label>File Type</label>
                                <div class="info-value">${escapeHtml(doc.file_type || 'Unknown')}</div>
                            </div>
                            
                            <div class="info-item">
                                <label>File Size</label>
                                <div class="info-value">${doc.file_size ? formatFileSize(doc.file_size) : 'Unknown'}</div>
                            </div>
                            
                            <div class="info-item">
                                <label>Downloads</label>
                                <div class="info-value">${doc.download_count}</div>
                            </div>
                            
                            <div class="info-item">
                                <label>Uploaded</label>
                                <div class="info-value">${formatDate(doc.created_at)}</div>
                            </div>
                            
                            ${doc.uploaded_by_username ? `
                                <div class="info-item">
                                    <label>Uploaded by</label>
                                    <div class="info-value">${escapeHtml(doc.uploaded_by_username)}</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${doc.tags && doc.tags.length > 0 ? `
                            <div class="document-tags">
                                <label>Tags</label>
                                <div class="tags-list">
                                    ${doc.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="document-actions" style="margin-top: 2rem;">
                            <button class="btn btn-primary btn-full" onclick="downloadDocument(${doc.id}); closeModal('document-details-modal');">
                                <i class="fas fa-download"></i>
                                Download Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('document-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('document-details-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('document-details-modal').addEventListener('click', (e) => {
        if (e.target.id === 'document-details-modal') {
            closeModal('document-details-modal');
        }
    });
}

// Admin: Upload new document
async function uploadDocument() {
    if (!requireAdmin()) return;

    const modalHTML = `
        <div class="modal-overlay" id="upload-document-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Upload Document</h2>
                    <button class="modal-close" onclick="closeModal('upload-document-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="upload-document-form" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="upload-title">Document Title *</label>
                            <input type="text" id="upload-title" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="upload-description">Description</label>
                            <textarea id="upload-description" rows="3" placeholder="Brief description of the document..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="upload-category">Category</label>
                            <select id="upload-category">
                                <option value="">Select category...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="upload-tags">Tags (comma-separated)</label>
                            <input type="text" id="upload-tags" placeholder="agriculture, forms, permits">
                        </div>
                        
                        <div class="form-group">
                            <label for="upload-file">Document File *</label>
                            <input type="file" id="upload-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf" required>
                            <small style="color: var(--text-muted);">Accepted formats: PDF, DOC, DOCX, XLS, XLSX, TXT, RTF (Max: 10MB)</small>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="upload-featured"> 
                                Mark as featured document
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-upload"></i>
                            Upload Document
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('upload-document-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Load categories for dropdown
    try {
        const response = await fetch('/api/documents/categories');
        if (response.ok) {
            const categories = await response.json();
            const categorySelect = document.getElementById('upload-category');
            categorySelect.innerHTML = '<option value="">Select category...</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Load categories for upload error:', error);
    }

    // Show modal
    document.getElementById('upload-document-modal').classList.add('show');

    // Handle form submission
    document.getElementById('upload-document-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('upload-title').value.trim());
        formData.append('description', document.getElementById('upload-description').value.trim());
        formData.append('categoryId', document.getElementById('upload-category').value);
        formData.append('tags', document.getElementById('upload-tags').value.trim());
        formData.append('isFeatured', document.getElementById('upload-featured').checked);
        
        const fileInput = document.getElementById('upload-file');
        if (fileInput.files[0]) {
            formData.append('document', fileInput.files[0]);
        }

        try {
            showLoading();
            
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('agroph_token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Success', 'Document uploaded successfully!', 'success');
                closeModal('upload-document-modal');
                loadDocuments(currentDocumentsPage);
            } else {
                showToast('Upload Failed', data.error || 'Failed to upload document.', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Network Error', 'Failed to upload document. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Close modal when clicking overlay
    document.getElementById('upload-document-modal').addEventListener('click', (e) => {
        if (e.target.id === 'upload-document-modal') {
            closeModal('upload-document-modal');
        }
    });
}

// Clear document filters
function clearDocumentFilters() {
    currentDocumentsFilters = {
        search: '',
        category: '',
        featured: false
    };
    currentDocumentsPage = 1;

    // Reset UI
    const searchInput = document.getElementById('document-search');
    const categoryFilter = document.getElementById('category-filter');
    const featuredFilter = document.getElementById('featured-filter');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (featuredFilter) featuredFilter.classList.remove('active');

    loadDocuments();
}

// Search documents by query
function searchDocuments(query) {
    currentDocumentsFilters.search = query;
    currentDocumentsPage = 1;
    
    const searchInput = document.getElementById('document-search');
    if (searchInput) {
        searchInput.value = query;
    }
    
    loadDocuments();
}

// Export documents functions
window.DocumentsModule = {
    loadDocuments,
    loadDocumentCategories,
    downloadDocument,
    viewDocumentDetails,
    filterByCategory,
    uploadDocument,
    clearDocumentFilters,
    searchDocuments
};