// Admin Panel JavaScript
// Created by Marwen Deiparine

let currentAdminTab = 'dashboard';

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchAdminTab(tabName);
        });
    });
}

// Switch admin tab
function switchAdminTab(tabName) {
    if (!isAdmin()) return;

    currentAdminTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Load tab content
    loadAdminTab(tabName);
}

// Load admin tab content
async function loadAdminTab(tabName) {
    if (!isAdmin()) return;

    const contentContainer = document.getElementById('admin-content');
    if (!contentContainer) return;

    showLoading();

    try {
        switch (tabName) {
            case 'dashboard':
                await loadAdminDashboard();
                break;
            case 'documents':
                await loadAdminDocuments();
                break;
            case 'users':
                await loadAdminUsers();
                break;
            case 'forum':
                await loadAdminForum();
                break;
            case 'announcements':
                await loadAdminAnnouncements();
                break;
            default:
                contentContainer.innerHTML = '<p>Tab not found.</p>';
        }
    } catch (error) {
        console.error('Load admin tab error:', error);
        contentContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load ${tabName} data.</p>
                <button class="btn btn-outline" onclick="loadAdminTab('${tabName}')">Try Again</button>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    try {
        const response = await apiRequest('/api/admin/dashboard');
        if (!response || !response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        const contentContainer = document.getElementById('admin-content');

        contentContainer.innerHTML = `
            <div class="admin-dashboard">
                <h3>Dashboard Overview</h3>
                
                <div class="admin-stats-grid">
                    <div class="admin-stat-card" style="--stat-color: var(--primary)">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-value">${data.statistics.users.total_users}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    
                    <div class="admin-stat-card" style="--stat-color: var(--secondary)">
                        <div class="stat-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="stat-value">${data.statistics.documents.total_documents}</div>
                        <div class="stat-label">Documents</div>
                    </div>
                    
                    <div class="admin-stat-card" style="--stat-color: var(--accent)">
                        <div class="stat-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="stat-value">${data.statistics.forum.total_posts}</div>
                        <div class="stat-label">Forum Posts</div>
                    </div>
                    
                    <div class="admin-stat-card" style="--stat-color: var(--success)">
                        <div class="stat-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="stat-value">${data.statistics.documents.total_downloads || 0}</div>
                        <div class="stat-label">Downloads</div>
                    </div>
                </div>
                
                <div class="admin-dashboard-grid">
                    <div class="dashboard-section">
                        <h4>Recent Users</h4>
                        <div class="recent-items">
                            ${data.recentActivity.users.map(user => `
                                <div class="recent-item">
                                    <div class="item-avatar">
                                        ${user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="item-info">
                                        <div class="item-title">${escapeHtml(user.username)}</div>
                                        <div class="item-subtitle">${escapeHtml(user.full_name || 'No name')}</div>
                                        <div class="item-date">${formatRelativeTime(user.created_at)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>Recent Documents</h4>
                        <div class="recent-items">
                            ${data.recentActivity.documents.map(doc => `
                                <div class="recent-item">
                                    <div class="item-icon">
                                        <i class="fas fa-file-pdf"></i>
                                    </div>
                                    <div class="item-info">
                                        <div class="item-title">${escapeHtml(doc.title)}</div>
                                        <div class="item-subtitle">${doc.download_count} downloads</div>
                                        <div class="item-date">${formatRelativeTime(doc.created_at)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>Recent Posts</h4>
                        <div class="recent-items">
                            ${data.recentActivity.posts.map(post => `
                                <div class="recent-item">
                                    <div class="item-avatar">
                                        ${post.author ? post.author.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div class="item-info">
                                        <div class="item-title">${escapeHtml(post.title)}</div>
                                        <div class="item-subtitle">by ${escapeHtml(post.author || 'Unknown')}</div>
                                        <div class="item-date">${formatRelativeTime(post.created_at)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h4>Quick Actions</h4>
                    <div class="quick-actions-grid">
                        <button class="btn btn-primary" onclick="uploadDocument()">
                            <i class="fas fa-upload"></i>
                            Upload Document
                        </button>
                        <button class="btn btn-outline" onclick="switchAdminTab('announcements')">
                            <i class="fas fa-bullhorn"></i>
                            Manage Announcements
                        </button>
                        <button class="btn btn-outline" onclick="showAdminChatControls()">
                            <i class="fas fa-comments"></i>
                            Chat Administration
                        </button>
                        <button class="btn btn-outline" onclick="exportSystemData()">
                            <i class="fas fa-download"></i>
                            Export Data
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Dashboard load error:', error);
        throw error;
    }
}

// Load admin documents management
async function loadAdminDocuments() {
    try {
        const response = await apiRequest('/api/documents?limit=20');
        if (!response || !response.ok) {
            throw new Error('Failed to load documents');
        }

        const data = await response.json();
        const contentContainer = document.getElementById('admin-content');

        contentContainer.innerHTML = `
            <div class="admin-documents">
                <div class="admin-section-header">
                    <h3>Document Management</h3>
                    <button class="btn btn-primary" onclick="uploadDocument()">
                        <i class="fas fa-upload"></i>
                        Upload Document
                    </button>
                </div>
                
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Downloads</th>
                                <th>Size</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.documents.map(doc => `
                                <tr>
                                    <td>
                                        <div class="table-cell-content">
                                            <strong>${escapeHtml(doc.title)}</strong>
                                            ${doc.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
                                        </div>
                                    </td>
                                    <td>${escapeHtml(doc.category_name || 'Uncategorized')}</td>
                                    <td>${doc.download_count}</td>
                                    <td>${doc.file_size ? formatFileSize(doc.file_size) : '-'}</td>
                                    <td>${formatDate(doc.created_at)}</td>
                                    <td>
                                        <div class="admin-actions">
                                            <button class="btn btn-outline btn-sm" onclick="editDocument(${doc.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="deleteDocument(${doc.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Documents load error:', error);
        throw error;
    }
}

// Load admin users management
async function loadAdminUsers() {
    try {
        const response = await apiRequest('/api/admin/users?limit=20');
        if (!response || !response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        const contentContainer = document.getElementById('admin-content');

        contentContainer.innerHTML = `
            <div class="admin-users">
                <div class="admin-section-header">
                    <h3>User Management</h3>
                    <div class="admin-search">
                        <input type="text" placeholder="Search users..." id="admin-user-search">
                        <button class="btn btn-outline" onclick="searchAdminUsers()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Location</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.users.map(user => `
                                <tr>
                                    <td>
                                        <div class="table-cell-content">
                                            <div class="user-avatar-small">
                                                ${user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <strong>${escapeHtml(user.username)}</strong>
                                                <br><small>${escapeHtml(user.full_name || 'No name')}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${escapeHtml(user.email)}</td>
                                    <td>
                                        <span class="role-badge ${user.role}">
                                            ${user.role === 'admin' ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-user"></i>'}
                                            ${user.role}
                                        </span>
                                    </td>
                                    <td>${escapeHtml(user.location || '-')}</td>
                                    <td>${formatDate(user.created_at)}</td>
                                    <td>
                                        <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                                            ${user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="admin-actions">
                                            <button class="btn btn-outline btn-sm" onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                                                <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                                            </button>
                                            <button class="btn btn-outline btn-sm" onclick="changeUserRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')">
                                                <i class="fas fa-user-cog"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Users load error:', error);
        throw error;
    }
}

// Load admin forum management
async function loadAdminForum() {
    try {
        const [postsResponse, categoriesResponse] = await Promise.all([
            apiRequest('/api/forum/posts?limit=20'),
            apiRequest('/api/forum/categories')
        ]);

        if (!postsResponse || !postsResponse.ok || !categoriesResponse || !categoriesResponse.ok) {
            throw new Error('Failed to load forum data');
        }

        const postsData = await postsResponse.json();
        const categories = await categoriesResponse.json();
        const contentContainer = document.getElementById('admin-content');

        contentContainer.innerHTML = `
            <div class="admin-forum">
                <div class="admin-section-header">
                    <h3>Forum Management</h3>
                    <div class="admin-forum-actions">
                        <button class="btn btn-outline" onclick="managePinnedPosts()">
                            <i class="fas fa-thumbtack"></i>
                            Manage Pinned
                        </button>
                        <button class="btn btn-outline" onclick="moderateReports()">
                            <i class="fas fa-flag"></i>
                            Reports
                        </button>
                    </div>
                </div>
                
                <div class="forum-categories-admin">
                    <h4>Categories</h4>
                    <div class="categories-admin-grid">
                        ${categories.map(cat => `
                            <div class="category-admin-card" style="--category-color: ${cat.color}">
                                <div class="category-admin-header">
                                    <div class="category-icon" style="background-color: ${cat.color}">
                                        <i class="${cat.icon}"></i>
                                    </div>
                                    <div>
                                        <h5>${escapeHtml(cat.name)}</h5>
                                        <p>${cat.post_count || 0} posts</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="admin-table-container">
                    <h4>Recent Posts</h4>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Category</th>
                                <th>Replies</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${postsData.posts.map(post => `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(post.title)}</strong>
                                        ${post.is_pinned ? '<span class="post-badge pinned">Pinned</span>' : ''}
                                        ${post.is_locked ? '<span class="post-badge locked">Locked</span>' : ''}
                                    </td>
                                    <td>${escapeHtml(post.author_username || 'Unknown')}</td>
                                    <td>${escapeHtml(post.category_name || 'Uncategorized')}</td>
                                    <td>${post.reply_count}</td>
                                    <td>${formatDate(post.created_at)}</td>
                                    <td>
                                        <span class="status-badge ${post.is_locked ? 'locked' : 'active'}">
                                            ${post.is_locked ? 'Locked' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="admin-actions">
                                            <button class="btn btn-outline btn-sm" onclick="viewForumPost(${post.id})">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline btn-sm" onclick="togglePostPin(${post.id}, ${!post.is_pinned})">
                                                <i class="fas fa-thumbtack"></i>
                                            </button>
                                            <button class="btn btn-outline btn-sm" onclick="togglePostLock(${post.id}, ${!post.is_locked})">
                                                <i class="fas fa-lock"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Forum admin load error:', error);
        throw error;
    }
}

// Load admin announcements
async function loadAdminAnnouncements() {
    try {
        const response = await apiRequest('/api/admin/announcements');
        if (!response || !response.ok) {
            throw new Error('Failed to load announcements');
        }

        const announcements = await response.json();
        const contentContainer = document.getElementById('admin-content');

        contentContainer.innerHTML = `
            <div class="admin-announcements">
                <div class="admin-section-header">
                    <h3>Announcements Management</h3>
                    <button class="btn btn-primary" onclick="createAnnouncement()">
                        <i class="fas fa-plus"></i>
                        New Announcement
                    </button>
                </div>
                
                <div class="announcements-admin-list">
                    ${announcements.map(ann => `
                        <div class="announcement-admin-card ${ann.type}">
                            <div class="announcement-admin-header">
                                <div class="announcement-icon">
                                    <i class="fas ${getAnnouncementIcon(ann.type)}"></i>
                                </div>
                                <div class="announcement-info">
                                    <h4>${escapeHtml(ann.title)}</h4>
                                    <p class="announcement-meta">
                                        ${formatDate(ann.created_at)} • 
                                        <span class="status-badge ${ann.is_active ? 'active' : 'inactive'}">
                                            ${ann.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                                <div class="announcement-actions">
                                    <button class="btn btn-outline btn-sm" onclick="editAnnouncement(${ann.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline btn-sm" onclick="toggleAnnouncementStatus(${ann.id}, ${!ann.is_active})">
                                        <i class="fas fa-${ann.is_active ? 'eye-slash' : 'eye'}"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement(${ann.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="announcement-content">
                                ${escapeHtml(ann.content)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Announcements load error:', error);
        throw error;
    }
}

// Toggle user status
async function toggleUserStatus(userId, isActive) {
    try {
        const response = await apiRequest(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive })
        });

        if (response && response.ok) {
            showToast('Success', `User ${isActive ? 'activated' : 'deactivated'} successfully.`, 'success');
            loadAdminTab('users');
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to update user status.', 'error');
        }
    } catch (error) {
        console.error('Toggle user status error:', error);
        showToast('Network Error', 'Failed to update user status.', 'error');
    }
}

// Change user role
async function changeUserRole(userId, newRole) {
    const confirm = window.confirm(`Are you sure you want to change this user's role to ${newRole}?`);
    if (!confirm) return;

    try {
        const response = await apiRequest(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });

        if (response && response.ok) {
            showToast('Success', `User role changed to ${newRole} successfully.`, 'success');
            loadAdminTab('users');
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to change user role.', 'error');
        }
    } catch (error) {
        console.error('Change user role error:', error);
        showToast('Network Error', 'Failed to change user role.', 'error');
    }
}

// Create new announcement
function createAnnouncement() {
    const modalHTML = `
        <div class="modal-overlay" id="create-announcement-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create Announcement</h2>
                    <button class="modal-close" onclick="closeModal('create-announcement-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="create-announcement-form">
                        <div class="form-group">
                            <label for="announcement-title">Title *</label>
                            <input type="text" id="announcement-title" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="announcement-type">Type</label>
                            <select id="announcement-type">
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="announcement-content">Content *</label>
                            <textarea id="announcement-content" rows="5" required></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-bullhorn"></i>
                            Create Announcement
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('create-announcement-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('create-announcement-modal').classList.add('show');

    // Handle form submission
    document.getElementById('create-announcement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('announcement-title').value.trim();
        const content = document.getElementById('announcement-content').value.trim();
        const type = document.getElementById('announcement-type').value;

        try {
            const response = await apiRequest('/api/admin/announcements', {
                method: 'POST',
                body: JSON.stringify({ title, content, type })
            });

            if (response && response.ok) {
                showToast('Success', 'Announcement created successfully!', 'success');
                closeModal('create-announcement-modal');
                loadAdminTab('announcements');
            } else {
                const errorData = await response.json();
                showToast('Error', errorData.error || 'Failed to create announcement.', 'error');
            }
        } catch (error) {
            console.error('Create announcement error:', error);
            showToast('Network Error', 'Failed to create announcement.', 'error');
        }
    });

    // Close modal when clicking overlay
    document.getElementById('create-announcement-modal').addEventListener('click', (e) => {
        if (e.target.id === 'create-announcement-modal') {
            closeModal('create-announcement-modal');
        }
    });
}

// Delete announcement
async function deleteAnnouncement(announcementId) {
    const confirm = window.confirm('Are you sure you want to delete this announcement?');
    if (!confirm) return;

    try {
        const response = await apiRequest(`/api/admin/announcements/${announcementId}`, {
            method: 'DELETE'
        });

        if (response && response.ok) {
            showToast('Success', 'Announcement deleted successfully.', 'success');
            loadAdminTab('announcements');
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to delete announcement.', 'error');
        }
    } catch (error) {
        console.error('Delete announcement error:', error);
        showToast('Network Error', 'Failed to delete announcement.', 'error');
    }
}

// Export system data
async function exportSystemData() {
    if (!requireAdmin()) return;

    const modalHTML = `
        <div class="modal-overlay" id="export-data-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Export System Data</h2>
                    <button class="modal-close" onclick="closeModal('export-data-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Select the data you want to export:</p>
                    <div class="export-options">
                        <button class="btn btn-outline btn-full" onclick="exportChatHistory()">
                            <i class="fas fa-comments"></i>
                            Export Chat History
                        </button>
                        <button class="btn btn-outline btn-full" onclick="exportUserData()">
                            <i class="fas fa-users"></i>
                            Export User Data
                        </button>
                        <button class="btn btn-outline btn-full" onclick="exportForumData()">
                            <i class="fas fa-forum"></i>
                            Export Forum Data
                        </button>
                        <button class="btn btn-outline btn-full" onclick="exportDocumentStats()">
                            <i class="fas fa-file-pdf"></i>
                            Export Document Statistics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('export-data-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('export-data-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('export-data-modal').addEventListener('click', (e) => {
        if (e.target.id === 'export-data-modal') {
            closeModal('export-data-modal');
        }
    });
}

// Export user data
async function exportUserData() {
    try {
        showLoading();
        
        const response = await apiRequest('/api/admin/users?limit=1000');
        if (!response || !response.ok) {
            throw new Error('Failed to export user data');
        }

        const data = await response.json();
        
        // Create CSV content
        const csvContent = [
            'Username,Email,Full Name,Role,Location,Active,Created At',
            ...data.users.map(user => 
                `"${user.username}","${user.email}","${user.full_name || ''}","${user.role}","${user.location || ''}","${user.is_active}","${user.created_at}"`
            )
        ].join('\n');

        // Download file
        downloadCSV(csvContent, `agroph-users-${new Date().toISOString().split('T')[0]}.csv`);
        
        showToast('Success', 'User data exported successfully.', 'success');
        closeModal('export-data-modal');
        
    } catch (error) {
        console.error('Export user data error:', error);
        showToast('Error', 'Failed to export user data.', 'error');
    } finally {
        hideLoading();
    }
}

// Download CSV utility
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Export admin functions
window.AdminModule = {
    loadAdminTab,
    switchAdminTab,
    loadAdminDashboard,
    loadAdminDocuments,
    loadAdminUsers,
    loadAdminForum,
    loadAdminAnnouncements,
    toggleUserStatus,
    changeUserRole,
    createAnnouncement,
    deleteAnnouncement,
    exportSystemData,
    exportUserData
};