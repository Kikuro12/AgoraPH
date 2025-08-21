// Forum JavaScript
// Created by Marwen Deiparine

let currentForumPage = 1;
let currentForumFilters = {
    search: '',
    category: ''
};
let forumCategories = [];

// Initialize forum functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeForum();
});

function initializeForum() {
    // Search functionality
    const searchInput = document.getElementById('forum-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentForumFilters.search = e.target.value.trim();
            currentForumPage = 1;
            loadForumPosts();
        }, 500));
    }

    // Category filter
    const categoryFilter = document.getElementById('forum-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentForumFilters.category = e.target.value;
            currentForumPage = 1;
            loadForumPosts();
        });
    }

    // New post button
    const newPostBtn = document.getElementById('new-post-btn');
    if (newPostBtn) {
        newPostBtn.addEventListener('click', showNewPostModal);
    }
}

// Load forum categories
async function loadForumCategories() {
    try {
        const response = await fetch('/api/forum/categories');
        if (!response.ok) return;

        forumCategories = await response.json();
        
        // Update category filter dropdown
        const categoryFilter = document.getElementById('forum-category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                forumCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }

        // Display categories
        const categoriesContainer = document.getElementById('forum-categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = forumCategories.map(category => `
                <div class="forum-category-card" onclick="filterForumByCategory(${category.id})" 
                     style="--category-color: ${category.color}">
                    <div class="category-header">
                        <div class="category-icon" style="background-color: ${category.color}">
                            <i class="${category.icon}"></i>
                        </div>
                        <div class="category-info">
                            <h3>${escapeHtml(category.name)}</h3>
                            <p>${escapeHtml(category.description || '')}</p>
                        </div>
                    </div>
                    <div class="category-stats">
                        <span>${category.post_count || 0} posts</span>
                        ${category.last_post_date ? `<span>Last: ${formatRelativeTime(category.last_post_date)}</span>` : '<span>No posts yet</span>'}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load forum categories error:', error);
        showToast('Error', 'Failed to load forum categories.', 'error');
    }
}

// Filter forum posts by category
function filterForumByCategory(categoryId) {
    currentForumFilters.category = categoryId.toString();
    currentForumPage = 1;
    
    // Update filter dropdown
    const categoryFilter = document.getElementById('forum-category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
    }
    
    loadForumPosts();
}

// Load forum posts
async function loadForumPosts(page = 1) {
    currentForumPage = page;
    
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10'
        });

        if (currentForumFilters.search) {
            params.append('search', currentForumFilters.search);
        }
        if (currentForumFilters.category) {
            params.append('category', currentForumFilters.category);
        }

        const response = await fetch(`/api/forum/posts?${params}`);
        if (!response.ok) {
            throw new Error('Failed to load forum posts');
        }

        const data = await response.json();
        displayForumPosts(data.posts);
        generatePagination(data.pagination, 'forum-pagination', 'loadForumPosts');
        
    } catch (error) {
        console.error('Load forum posts error:', error);
        showToast('Error', 'Failed to load forum posts.', 'error');
    }
}

// Display forum posts
function displayForumPosts(posts) {
    const container = document.getElementById('forum-posts');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-comments" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h3>No posts found</h3>
                <p>Be the first to start a discussion!</p>
                ${currentUser ? `
                    <button class="btn btn-primary" onclick="showNewPostModal()">
                        <i class="fas fa-plus"></i>
                        Create New Post
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="forum-post-card ${post.is_pinned ? 'pinned' : ''} ${post.is_locked ? 'locked' : ''}" 
             onclick="viewForumPost(${post.id})">
            <div class="post-header">
                <div class="post-avatar">
                    ${post.author_username ? post.author_username.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="post-info">
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(post.author_username || 'Unknown')}</span>
                        <span><i class="fas fa-calendar"></i> ${formatRelativeTime(post.created_at)}</span>
                        ${post.category_name ? `
                            <span style="color: ${post.category_color}">
                                <i class="fas fa-folder"></i> ${escapeHtml(post.category_name)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="post-content">${escapeHtml(post.content)}</div>
            
            <div class="post-footer">
                <div class="post-stats">
                    <span><i class="fas fa-eye"></i> ${post.view_count} views</span>
                    <span><i class="fas fa-reply"></i> ${post.reply_count} replies</span>
                    ${post.last_reply_at ? `<span><i class="fas fa-clock"></i> Last reply ${formatRelativeTime(post.last_reply_at)}</span>` : ''}
                </div>
                <div class="post-badges">
                    ${post.is_pinned ? '<span class="post-badge pinned"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                    ${post.is_locked ? '<span class="post-badge locked"><i class="fas fa-lock"></i> Locked</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// View forum post details
async function viewForumPost(postId) {
    try {
        showLoading();
        
        const response = await fetch(`/api/forum/posts/${postId}`);
        if (!response.ok) {
            throw new Error('Failed to load post details');
        }

        const data = await response.json();
        showForumPostModal(data.post, data.replies);
        
    } catch (error) {
        console.error('View post error:', error);
        showToast('Error', 'Failed to load post details.', 'error');
    } finally {
        hideLoading();
    }
}

// Show forum post modal
function showForumPostModal(post, replies) {
    const modalHTML = `
        <div class="modal-overlay" id="forum-post-modal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2>Forum Post</h2>
                    <button class="modal-close" onclick="closeModal('forum-post-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="forum-post-detail">
                        <div class="post-header-detail">
                            <div class="post-avatar-large">
                                ${post.author_username ? post.author_username.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div class="post-info-detail">
                                <h3>${escapeHtml(post.title)}</h3>
                                <div class="post-meta-detail">
                                    <span><i class="fas fa-user"></i> ${escapeHtml(post.author_username || 'Unknown')}</span>
                                    <span><i class="fas fa-calendar"></i> ${formatDate(post.created_at)}</span>
                                    ${post.category_name ? `
                                        <span style="color: ${post.category_color}">
                                            <i class="fas fa-folder"></i> ${escapeHtml(post.category_name)}
                                        </span>
                                    ` : ''}
                                    <span><i class="fas fa-eye"></i> ${post.view_count} views</span>
                                </div>
                                <div class="post-badges">
                                    ${post.is_pinned ? '<span class="post-badge pinned"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                                    ${post.is_locked ? '<span class="post-badge locked"><i class="fas fa-lock"></i> Locked</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="post-content-detail">
                            ${escapeHtml(post.content).replace(/\n/g, '<br>')}
                        </div>
                        
                        <div class="post-actions">
                            ${currentUser && !post.is_locked ? `
                                <button class="btn btn-primary" onclick="showReplyForm(${post.id})">
                                    <i class="fas fa-reply"></i>
                                    Reply
                                </button>
                            ` : ''}
                            ${currentUser && (currentUser.id === post.author_id || currentUser.role === 'admin') ? `
                                <button class="btn btn-outline" onclick="editForumPost(${post.id})">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                            ` : ''}
                            ${currentUser && currentUser.role === 'admin' ? `
                                <button class="btn btn-outline" onclick="togglePostPin(${post.id}, ${!post.is_pinned})">
                                    <i class="fas fa-thumbtack"></i>
                                    ${post.is_pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button class="btn btn-outline" onclick="togglePostLock(${post.id}, ${!post.is_locked})">
                                    <i class="fas fa-lock"></i>
                                    ${post.is_locked ? 'Unlock' : 'Lock'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="forum-replies">
                        <h4><i class="fas fa-comments"></i> Replies (${replies.length})</h4>
                        <div class="replies-list">
                            ${replies.map(reply => `
                                <div class="reply-item">
                                    <div class="reply-header">
                                        <div class="reply-avatar">
                                            ${reply.author_username ? reply.author_username.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div class="reply-info">
                                            <span class="reply-author">${escapeHtml(reply.author_username || 'Unknown')}</span>
                                            <span class="reply-date">${formatRelativeTime(reply.created_at)}</span>
                                        </div>
                                    </div>
                                    <div class="reply-content">
                                        ${escapeHtml(reply.content).replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${currentUser && !post.is_locked ? `
                            <div class="reply-form" id="reply-form-${post.id}" style="display: none;">
                                <h5>Add Reply</h5>
                                <textarea id="reply-content-${post.id}" rows="4" placeholder="Write your reply..."></textarea>
                                <div class="reply-actions">
                                    <button class="btn btn-primary" onclick="submitReply(${post.id})">
                                        <i class="fas fa-paper-plane"></i>
                                        Post Reply
                                    </button>
                                    <button class="btn btn-outline" onclick="hideReplyForm(${post.id})">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('forum-post-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('forum-post-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('forum-post-modal').addEventListener('click', (e) => {
        if (e.target.id === 'forum-post-modal') {
            closeModal('forum-post-modal');
        }
    });
}

// Show new post modal
function showNewPostModal() {
    if (!requireAuth(null, 'Please login to create a new post.')) return;

    const modalHTML = `
        <div class="modal-overlay" id="new-post-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create New Post</h2>
                    <button class="modal-close" onclick="closeModal('new-post-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="new-post-form">
                        <div class="form-group">
                            <label for="post-title">Post Title *</label>
                            <input type="text" id="post-title" required placeholder="Enter a descriptive title...">
                        </div>
                        
                        <div class="form-group">
                            <label for="post-category">Category</label>
                            <select id="post-category">
                                <option value="">Select category...</option>
                                ${forumCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="post-content">Content *</label>
                            <textarea id="post-content" rows="8" required placeholder="Write your post content..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-paper-plane"></i>
                            Create Post
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('new-post-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('new-post-modal').classList.add('show');

    // Handle form submission
    document.getElementById('new-post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const categoryId = document.getElementById('post-category').value;

        if (!title || !content) {
            showToast('Validation Error', 'Title and content are required.', 'error');
            return;
        }

        try {
            showLoading();
            
            const response = await apiRequest('/api/forum/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    content,
                    categoryId: categoryId || null
                })
            });

            if (response && response.ok) {
                const data = await response.json();
                showToast('Success', 'Post created successfully!', 'success');
                closeModal('new-post-modal');
                loadForumPosts(1); // Reload first page to show new post
            } else {
                const errorData = await response.json();
                showToast('Error', errorData.error || 'Failed to create post.', 'error');
            }
        } catch (error) {
            console.error('Create post error:', error);
            showToast('Network Error', 'Failed to create post. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Close modal when clicking overlay
    document.getElementById('new-post-modal').addEventListener('click', (e) => {
        if (e.target.id === 'new-post-modal') {
            closeModal('new-post-modal');
        }
    });
}

// Show reply form
function showReplyForm(postId) {
    const replyForm = document.getElementById(`reply-form-${postId}`);
    if (replyForm) {
        replyForm.style.display = 'block';
        const textarea = document.getElementById(`reply-content-${postId}`);
        if (textarea) {
            textarea.focus();
        }
    }
}

// Hide reply form
function hideReplyForm(postId) {
    const replyForm = document.getElementById(`reply-form-${postId}`);
    if (replyForm) {
        replyForm.style.display = 'none';
        const textarea = document.getElementById(`reply-content-${postId}`);
        if (textarea) {
            textarea.value = '';
        }
    }
}

// Submit reply
async function submitReply(postId) {
    const content = document.getElementById(`reply-content-${postId}`).value.trim();
    
    if (!content) {
        showToast('Validation Error', 'Reply content is required.', 'error');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest(`/api/forum/posts/${postId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        if (response && response.ok) {
            showToast('Success', 'Reply posted successfully!', 'success');
            hideReplyForm(postId);
            
            // Refresh the post modal to show new reply
            setTimeout(() => {
                viewForumPost(postId);
            }, 500);
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to post reply.', 'error');
        }
    } catch (error) {
        console.error('Submit reply error:', error);
        showToast('Network Error', 'Failed to post reply. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Edit forum post
function editForumPost(postId) {
    // This would open an edit modal similar to new post modal
    showToast('Feature Coming Soon', 'Post editing will be available soon.', 'info');
}

// Toggle post pin status (admin only)
async function togglePostPin(postId, isPinned) {
    if (!requireAdmin()) return;

    try {
        const response = await apiRequest(`/api/forum/posts/${postId}/pin`, {
            method: 'PATCH',
            body: JSON.stringify({ isPinned })
        });

        if (response && response.ok) {
            showToast('Success', `Post ${isPinned ? 'pinned' : 'unpinned'} successfully.`, 'success');
            closeModal('forum-post-modal');
            loadForumPosts(currentForumPage);
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to update post.', 'error');
        }
    } catch (error) {
        console.error('Toggle pin error:', error);
        showToast('Network Error', 'Failed to update post. Please try again.', 'error');
    }
}

// Toggle post lock status (admin only)
async function togglePostLock(postId, isLocked) {
    if (!requireAdmin()) return;

    try {
        const response = await apiRequest(`/api/forum/posts/${postId}/lock`, {
            method: 'PATCH',
            body: JSON.stringify({ isLocked })
        });

        if (response && response.ok) {
            showToast('Success', `Post ${isLocked ? 'locked' : 'unlocked'} successfully.`, 'success');
            closeModal('forum-post-modal');
            loadForumPosts(currentForumPage);
        } else {
            const errorData = await response.json();
            showToast('Error', errorData.error || 'Failed to update post.', 'error');
        }
    } catch (error) {
        console.error('Toggle lock error:', error);
        showToast('Network Error', 'Failed to update post. Please try again.', 'error');
    }
}

// Search forum posts
function searchForumPosts(query) {
    currentForumFilters.search = query;
    currentForumPage = 1;
    
    const searchInput = document.getElementById('forum-search');
    if (searchInput) {
        searchInput.value = query;
    }
    
    loadForumPosts();
}

// Clear forum filters
function clearForumFilters() {
    currentForumFilters = {
        search: '',
        category: ''
    };
    currentForumPage = 1;

    // Reset UI
    const searchInput = document.getElementById('forum-search');
    const categoryFilter = document.getElementById('forum-category-filter');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';

    loadForumPosts();
}

// Get forum statistics for admin
async function getForumStatistics() {
    if (!isAdmin()) return null;

    try {
        const response = await apiRequest('/api/admin/forum/stats');
        if (response && response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Get forum stats error:', error);
    }
    return null;
}

// Export forum functions
window.ForumModule = {
    loadForumCategories,
    loadForumPosts,
    viewForumPost,
    showNewPostModal,
    filterForumByCategory,
    searchForumPosts,
    clearForumFilters,
    togglePostPin,
    togglePostLock,
    getForumStatistics
};