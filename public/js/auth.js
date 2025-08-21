// Authentication JavaScript
// Created by Marwen Deiparine

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

// Initialize authentication event listeners
function initializeAuth() {
    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Register form
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', handleRegister);

    // Close modals when clicking overlay
    document.getElementById('auth-modal').addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') {
            closeModal('auth-modal');
        }
    });
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showToast('Validation Error', 'Please fill in all fields.', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token
            localStorage.setItem('agroph_token', data.token);
            
            // Update global user
            currentUser = data.user;
            
            // Update UI
            updateAuthUI(true);
            
            // Close modal
            closeModal('auth-modal');
            
            // Clear form
            document.getElementById('login-form').reset();
            
            // Initialize chat connection
            if (socket) {
                socket.emit('join_chat', currentUser);
            }
            
            showToast('Welcome back!', `Hello ${data.user.username}, you're now logged in.`, 'success');
        } else {
            showToast('Login Failed', data.error || 'Invalid credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network Error', 'Unable to connect to the server. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-fullname').value.trim();
    const location = document.getElementById('register-location').value.trim();

    // Validation
    if (!username || !email || !password) {
        showToast('Validation Error', 'Username, email, and password are required.', 'error');
        return;
    }

    if (username.length < 3) {
        showToast('Validation Error', 'Username must be at least 3 characters long.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Validation Error', 'Password must be at least 6 characters long.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Validation Error', 'Please enter a valid email address.', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                fullName: fullName || null,
                location: location || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token
            localStorage.setItem('agroph_token', data.token);
            
            // Update global user
            currentUser = data.user;
            
            // Update UI
            updateAuthUI(true);
            
            // Close modal
            closeModal('auth-modal');
            
            // Clear form
            document.getElementById('register-form').reset();
            
            // Initialize chat connection
            if (socket) {
                socket.emit('join_chat', currentUser);
            }
            
            showToast('Welcome to AgroPH!', `Account created successfully. Welcome ${data.user.username}!`, 'success');
        } else {
            showToast('Registration Failed', data.error || 'Unable to create account.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network Error', 'Unable to connect to the server. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Email validation utility
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Update user profile
async function updateUserProfile(profileData) {
    if (!currentUser) {
        showToast('Authentication Required', 'Please login to update your profile.', 'warning');
        return false;
    }

    showLoading();

    try {
        const response = await apiRequest('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (response && response.ok) {
            const data = await response.json();
            currentUser = { ...currentUser, ...data.user };
            
            showToast('Profile Updated', 'Your profile has been updated successfully.', 'success');
            return true;
        } else {
            const errorData = await response.json();
            showToast('Update Failed', errorData.error || 'Unable to update profile.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Network Error', 'Unable to update profile. Please try again.', 'error');
        return false;
    } finally {
        hideLoading();
    }
}

// Show user profile modal
function showUserProfile() {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }

    // Create profile modal HTML
    const profileModalHTML = `
        <div class="modal-overlay" id="profile-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>User Profile</h2>
                    <button class="modal-close" onclick="closeModal('profile-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="profile-form">
                        <div class="form-group">
                            <label for="profile-username">Username</label>
                            <input type="text" id="profile-username" value="${currentUser.username}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">Email</label>
                            <input type="email" id="profile-email" value="${currentUser.email}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="profile-fullname">Full Name</label>
                            <input type="text" id="profile-fullname" value="${currentUser.fullName || ''}">
                        </div>
                        <div class="form-group">
                            <label for="profile-location">Location</label>
                            <input type="text" id="profile-location" value="${currentUser.location || ''}" placeholder="e.g., Cebu City">
                        </div>
                        <div class="form-group">
                            <label for="profile-bio">Bio</label>
                            <textarea id="profile-bio" rows="3" placeholder="Tell us about yourself...">${currentUser.bio || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="profile-avatar">Avatar URL</label>
                            <input type="url" id="profile-avatar" value="${currentUser.avatarUrl || ''}" placeholder="https://example.com/avatar.jpg">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-save"></i>
                            Update Profile
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Remove existing profile modal
    const existingModal = document.getElementById('profile-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new profile modal
    document.body.insertAdjacentHTML('beforeend', profileModalHTML);

    // Show modal
    document.getElementById('profile-modal').classList.add('show');

    // Handle form submission
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profileData = {
            fullName: document.getElementById('profile-fullname').value.trim() || null,
            location: document.getElementById('profile-location').value.trim() || null,
            bio: document.getElementById('profile-bio').value.trim() || null,
            avatarUrl: document.getElementById('profile-avatar').value.trim() || null
        };

        const success = await updateUserProfile(profileData);
        if (success) {
            closeModal('profile-modal');
            
            // Update avatar in UI
            if (profileData.avatarUrl) {
                document.getElementById('avatar-img').src = profileData.avatarUrl;
            }
        }
    });

    // Close modal when clicking overlay
    document.getElementById('profile-modal').addEventListener('click', (e) => {
        if (e.target.id === 'profile-modal') {
            closeModal('profile-modal');
        }
    });
}

// Add profile link event listener
document.addEventListener('DOMContentLoaded', function() {
    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUserProfile();
        });
    }
});

// Check if user is admin
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Require authentication for certain actions
function requireAuth(callback, message = 'Please login to continue.') {
    if (!isAuthenticated()) {
        showToast('Authentication Required', message, 'warning');
        showAuthModal('login');
        return false;
    }
    
    if (callback) {
        callback();
    }
    return true;
}

// Require admin privileges
function requireAdmin(callback, message = 'Admin privileges required.') {
    if (!isAuthenticated()) {
        showToast('Authentication Required', 'Please login to continue.', 'warning');
        showAuthModal('login');
        return false;
    }
    
    if (!isAdmin()) {
        showToast('Access Denied', message, 'error');
        return false;
    }
    
    if (callback) {
        callback();
    }
    return true;
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) {
        strength += 1;
    } else {
        feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Uppercase letter');
    }

    if (/[0-9]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Special character');
    }

    return {
        strength: strength,
        feedback: feedback,
        isStrong: strength >= 4
    };
}

// Add password strength indicator to register form
function addPasswordStrengthIndicator() {
    const passwordInput = document.getElementById('register-password');
    const formGroup = passwordInput.parentElement;
    
    // Create strength indicator
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.innerHTML = `
        <div class="strength-meter">
            <div class="strength-fill"></div>
        </div>
        <div class="strength-text">Password strength</div>
        <div class="strength-feedback"></div>
    `;
    
    formGroup.appendChild(strengthIndicator);

    // Add event listener
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const result = checkPasswordStrength(password);
        
        const fill = strengthIndicator.querySelector('.strength-fill');
        const text = strengthIndicator.querySelector('.strength-text');
        const feedback = strengthIndicator.querySelector('.strength-feedback');
        
        // Update strength meter
        const percentage = (result.strength / 5) * 100;
        fill.style.width = `${percentage}%`;
        
        // Update color and text
        if (result.strength <= 2) {
            fill.style.background = 'var(--danger)';
            text.textContent = 'Weak password';
            text.style.color = 'var(--danger)';
        } else if (result.strength <= 3) {
            fill.style.background = 'var(--warning)';
            text.textContent = 'Fair password';
            text.style.color = 'var(--warning)';
        } else if (result.strength <= 4) {
            fill.style.background = 'var(--primary)';
            text.textContent = 'Good password';
            text.style.color = 'var(--primary)';
        } else {
            fill.style.background = 'var(--success)';
            text.textContent = 'Strong password';
            text.style.color = 'var(--success)';
        }
        
        // Show feedback
        if (result.feedback.length > 0 && password.length > 0) {
            feedback.textContent = `Missing: ${result.feedback.join(', ')}`;
            feedback.style.display = 'block';
        } else {
            feedback.style.display = 'none';
        }
    });
}

// Initialize password strength indicator when register form is shown
const originalShowAuthModal = window.showAuthModal;
window.showAuthModal = function(mode = 'login') {
    originalShowAuthModal(mode);
    
    if (mode === 'register') {
        // Add password strength indicator if not already added
        setTimeout(() => {
            const existingIndicator = document.querySelector('.password-strength');
            if (!existingIndicator) {
                addPasswordStrengthIndicator();
            }
        }, 100);
    }
};

// Auto-fill location suggestions for Philippine locations
function initializeLocationAutocomplete() {
    const locationInput = document.getElementById('register-location');
    if (!locationInput) return;

    const philippineLocations = [
        'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong',
        'Cebu City', 'Davao City', 'Zamboanga City', 'Cagayan de Oro',
        'Baguio City', 'Iloilo City', 'Bacolod City', 'General Santos',
        'Antipolo', 'Caloocan', 'Valenzuela', 'Las Piñas', 'Muntinlupa',
        'Parañaque', 'Marikina', 'Pasay', 'San Juan', 'Malabon', 'Navotas'
    ];

    // Create datalist for autocomplete
    const datalist = document.createElement('datalist');
    datalist.id = 'location-suggestions';
    
    philippineLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        datalist.appendChild(option);
    });
    
    locationInput.setAttribute('list', 'location-suggestions');
    locationInput.parentElement.appendChild(datalist);
}

// Initialize location autocomplete when register form is shown
document.addEventListener('DOMContentLoaded', function() {
    // Add mutation observer to detect when register form is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const registerForm = document.getElementById('register-form');
                if (registerForm && registerForm.style.display !== 'none') {
                    setTimeout(() => {
                        const existingDatalist = document.getElementById('location-suggestions');
                        if (!existingDatalist) {
                            initializeLocationAutocomplete();
                        }
                    }, 100);
                }
            }
        });
    });

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        observer.observe(registerForm, { attributes: true });
    }
});

// Handle forgot password (placeholder for future implementation)
function handleForgotPassword() {
    showToast('Feature Coming Soon', 'Password reset functionality will be available soon.', 'info');
}

// Handle social login (placeholder for future implementation)
function handleSocialLogin(provider) {
    showToast('Feature Coming Soon', `${provider} login will be available soon.`, 'info');
}

// Validate form inputs in real-time
function initializeFormValidation() {
    // Username validation
    const usernameInputs = document.querySelectorAll('#register-username, #login-username');
    usernameInputs.forEach(input => {
        input.addEventListener('blur', validateUsername);
        input.addEventListener('input', clearValidationError);
    });

    // Email validation
    const emailInput = document.getElementById('register-email');
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearValidationError);
    }
}

// Validate username
function validateUsername(e) {
    const input = e.target;
    const value = input.value.trim();
    
    if (value.length < 3) {
        showInputError(input, 'Username must be at least 3 characters long');
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        showInputError(input, 'Username can only contain letters, numbers, and underscores');
    } else {
        clearInputError(input);
    }
}

// Validate email
function validateEmail(e) {
    const input = e.target;
    const value = input.value.trim();
    
    if (value && !isValidEmail(value)) {
        showInputError(input, 'Please enter a valid email address');
    } else {
        clearInputError(input);
    }
}

// Show input validation error
function showInputError(input, message) {
    clearInputError(input);
    
    input.style.borderColor = 'var(--danger)';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.style.color = 'var(--danger)';
    errorDiv.style.fontSize = '0.75rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    input.parentElement.appendChild(errorDiv);
}

// Clear input validation error
function clearInputError(input) {
    input.style.borderColor = '';
    const errorDiv = input.parentElement.querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Clear validation error on input
function clearValidationError(e) {
    clearInputError(e.target);
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeFormValidation, 100);
});

// Export authentication functions
window.AuthModule = {
    handleLogin,
    handleRegister,
    updateUserProfile,
    showUserProfile,
    isAuthenticated,
    isAdmin,
    requireAuth,
    requireAdmin,
    isValidEmail,
    checkPasswordStrength
};