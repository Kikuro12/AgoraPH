// Main Application JavaScript
// Created by Marwen Deiparine

// Global variables
let currentUser = null;
let socket = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    console.log('🚀 Initializing AgroPH...');
    
    // Initialize navigation
    initializeNavigation();
    
    // Check authentication
    await checkAuthentication();
    
    // Initialize chat
    initializeChat();
    
    // Load initial data
    await loadInitialData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    console.log('✅ AgroPH initialized successfully');
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            navigateToSection(targetSection);
        });
    });

    // Handle feature card clicks
    document.querySelectorAll('[data-section]').forEach(element => {
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.btn') && !e.target.closest('input') && !e.target.closest('select')) {
                const targetSection = element.getAttribute('data-section');
                if (targetSection) {
                    navigateToSection(targetSection);
                }
            }
        });
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('show');
        }
    });
}

// Navigate to specific section
function navigateToSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Hide all sections
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update URL hash
        window.history.pushState(null, null, `#${sectionId}`);
        
        // Update active nav link
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink && activeLink.classList.contains('nav-link')) {
            activeLink.classList.add('active');
        }
        
        // Close mobile menu
        document.getElementById('nav-menu').classList.remove('show');
        
        // Load section-specific data
        loadSectionData(sectionId);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Load section-specific data
async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'documents':
            await loadDocuments();
            await loadDocumentCategories();
            break;
        case 'forum':
            await loadForumCategories();
            await loadForumPosts();
            break;
        case 'tools':
            await loadWeatherCities();
            initializeMap();
            break;
        case 'home':
            await loadHomeStats();
            await loadAnnouncements();
            break;
    }
}

// Check authentication status
async function checkAuthentication() {
    const token = localStorage.getItem('agroph_token');
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI(true);
            
            // Load user profile
            await loadUserProfile();
        } else {
            localStorage.removeItem('agroph_token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('agroph_token');
        updateAuthUI(false);
    }
}

// Update authentication UI
function updateAuthUI(isAuthenticated) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const newPostBtn = document.getElementById('new-post-btn');
    const adminLink = document.getElementById('admin-link');
    const chatLoginPrompt = document.getElementById('chat-login-prompt');
    const chatInput = document.getElementById('chat-input');

    if (isAuthenticated && currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        newPostBtn.style.display = 'inline-flex';
        chatLoginPrompt.style.display = 'none';
        chatInput.style.display = 'flex';
        
        // Update user display
        document.getElementById('username-display').textContent = currentUser.username;
        
        // Show admin link for admins
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        newPostBtn.style.display = 'none';
        adminLink.style.display = 'none';
        chatLoginPrompt.style.display = 'block';
        chatInput.style.display = 'none';
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('agroph_token')}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = { ...currentUser, ...userData };
            
            // Update avatar if available
            if (userData.avatarUrl) {
                document.getElementById('avatar-img').src = userData.avatarUrl;
            }
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Load initial data for home page
async function loadInitialData() {
    try {
        // Load document count
        const docsResponse = await fetch('/api/documents?limit=1');
        if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            document.getElementById('total-documents').textContent = docsData.pagination.totalCount;
        }

        // Load forum posts count
        const forumResponse = await fetch('/api/forum/posts?limit=1');
        if (forumResponse.ok) {
            const forumData = await forumResponse.json();
            document.getElementById('forum-posts').textContent = forumData.pagination.totalCount;
        }
    } catch (error) {
        console.error('Initial data load error:', error);
    }
}

// Load home page statistics
async function loadHomeStats() {
    try {
        const [docsResponse, forumResponse] = await Promise.all([
            fetch('/api/documents?limit=1'),
            fetch('/api/forum/posts?limit=1')
        ]);

        if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            document.getElementById('total-documents').textContent = docsData.pagination.totalCount;
        }

        if (forumResponse.ok) {
            const forumData = await forumResponse.json();
            document.getElementById('forum-posts').textContent = forumData.pagination.totalCount;
        }
    } catch (error) {
        console.error('Home stats error:', error);
    }
}

// Load announcements
async function loadAnnouncements() {
    try {
        const response = await fetch('/api/admin/announcements');
        if (!response.ok) return;

        const announcements = await response.json();
        const container = document.getElementById('announcements-grid');
        
        if (announcements.length === 0) {
            document.getElementById('announcements-section').style.display = 'none';
            return;
        }

        container.innerHTML = announcements
            .filter(ann => ann.is_active)
            .slice(0, 3) // Show only latest 3
            .map(announcement => `
                <div class="announcement-card ${announcement.type}">
                    <div class="announcement-header">
                        <div class="announcement-icon">
                            <i class="fas ${getAnnouncementIcon(announcement.type)}"></i>
                        </div>
                        <div class="announcement-title">${escapeHtml(announcement.title)}</div>
                    </div>
                    <div class="announcement-content">${escapeHtml(announcement.content)}</div>
                    <div class="announcement-date">${formatDate(announcement.created_at)}</div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Announcements load error:', error);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', () => showAuthModal('login'));
    document.getElementById('register-btn').addEventListener('click', () => showAuthModal('register'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // User menu dropdown
    document.getElementById('user-avatar').addEventListener('click', toggleUserDropdown);
    document.getElementById('admin-link').addEventListener('click', (e) => {
        e.preventDefault();
        showAdminPanel();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdown-menu');
        const userAvatar = document.getElementById('user-avatar');
        
        if (!userAvatar.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle initial hash
    handleHashChange();
}

// Handle URL hash changes
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        navigateToSection(hash);
    }
}

// Toggle user dropdown menu
function toggleUserDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    dropdown.classList.toggle('show');
}

// Show authentication modal
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-modal-title');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (mode === 'login') {
        title.textContent = 'Login';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        switchText.textContent = "Don't have an account?";
        switchBtn.textContent = 'Register here';
        switchBtn.onclick = () => showAuthModal('register');
    } else {
        title.textContent = 'Register';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Login here';
        switchBtn.onclick = () => showAuthModal('login');
    }

    modal.classList.add('show');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Show admin panel
function showAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied', 'You need admin privileges to access this panel.', 'error');
        return;
    }
    
    const modal = document.getElementById('admin-modal');
    modal.classList.add('show');
    
    // Load admin dashboard by default
    loadAdminTab('dashboard');
}

// Logout user
function logout() {
    localStorage.removeItem('agroph_token');
    currentUser = null;
    updateAuthUI(false);
    
    // Disconnect socket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    // Navigate to home
    navigateToSection('home');
    
    showToast('Logged out', 'You have been logged out successfully.', 'success');
}

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${escapeHtml(title)}</div>
            <button class="toast-close" onclick="removeToast('${toastId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-message">${escapeHtml(message)}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => removeToast(toastId), 5000);
}

// Remove toast notification
function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date utility
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Format relative time
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric'
        });
    }
}

// Get announcement icon based on type
function getAnnouncementIcon(type) {
    switch (type) {
        case 'warning': return 'fa-exclamation-triangle';
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate pagination HTML
function generatePagination(pagination, containerId, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;

    const { currentPage, totalPages, hasPrev, hasNext } = pagination;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn" ${!hasPrev ? 'disabled' : ''} 
                onclick="${loadFunction}(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="${loadFunction}(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="${loadFunction}(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="${loadFunction}(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn" ${!hasNext ? 'disabled' : ''} 
                onclick="${loadFunction}(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

// API request helper
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('agroph_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('agroph_token');
            currentUser = null;
            updateAuthUI(false);
            showToast('Session expired', 'Please login again.', 'warning');
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        showToast('Network error', 'Please check your connection and try again.', 'error');
        return null;
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize chat connection
function initializeChat() {
    if (typeof io !== 'undefined') {
        socket = io();
        
        socket.on('connect', () => {
            console.log('💬 Connected to chat');
            updateChatStatus(true);
            
            if (currentUser) {
                socket.emit('join_chat', currentUser);
            }
        });
        
        socket.on('disconnect', () => {
            console.log('💬 Disconnected from chat');
            updateChatStatus(false);
        });
    }
}

// Update chat status indicator
function updateChatStatus(isOnline) {
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
        indicator.classList.toggle('online', isOnline);
        indicator.classList.toggle('offline', !isOnline);
    }
}

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Reinitialize map if needed
    if (window.philippinesMap) {
        setTimeout(() => {
            window.philippinesMap.invalidateSize();
        }, 100);
    }
}, 250));

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser && socket) {
        // Reconnect if needed
        if (!socket.connected) {
            socket.connect();
        }
    }
});

// Export functions for use in other scripts
window.AgroPH = {
    navigateToSection,
    showAuthModal,
    closeModal,
    showToast,
    removeToast,
    showLoading,
    hideLoading,
    apiRequest,
    formatDate,
    formatRelativeTime,
    formatFileSize,
    escapeHtml,
    generatePagination,
    currentUser: () => currentUser,
    socket: () => socket
};