// Chat JavaScript
// Created by Marwen Deiparine

let chatMessages = [];
let isChatMinimized = false;

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    // Chat toggle
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        // Remove existing onclick to avoid conflicts
        chatHeader.removeAttribute('onclick');
        chatHeader.addEventListener('click', toggleChat);
    }

    // Send message button
    const sendButton = document.getElementById('send-message');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Initialize socket events
    initializeSocketEvents();
    
    // Load chat history
    loadChatHistory();
}

// Initialize Socket.io events for chat
function initializeSocketEvents() {
    if (!socket) return;

    // Receive messages
    socket.on('receive_message', (data) => {
        addMessageToChat(data);
    });

    // User joined notification
    socket.on('user_joined', (data) => {
        addSystemMessage(`${data.username} joined the chat`);
    });

    // User left notification
    socket.on('user_left', (data) => {
        addSystemMessage(`${data.username} left the chat`);
    });

    // Error handling
    socket.on('error', (error) => {
        showToast('Chat Error', error, 'error');
    });

    // Connection events
    socket.on('connect', () => {
        updateChatStatus(true);
        if (currentUser) {
            socket.emit('join_chat', currentUser);
        }
    });

    socket.on('disconnect', () => {
        updateChatStatus(false);
        addSystemMessage('Connection lost. Trying to reconnect...');
    });

    socket.on('reconnect', () => {
        updateChatStatus(true);
        addSystemMessage('Reconnected to chat.');
        if (currentUser) {
            socket.emit('join_chat', currentUser);
        }
    });
}

// Toggle chat widget
function toggleChat() {
    const chatWidget = document.getElementById('chat-widget');
    const chatToggleIcon = document.getElementById('chat-toggle-icon');
    
    isChatMinimized = !isChatMinimized;
    chatWidget.classList.toggle('minimized', isChatMinimized);
    
    if (isChatMinimized) {
        chatToggleIcon.className = 'fas fa-chevron-down';
    } else {
        chatToggleIcon.className = 'fas fa-chevron-up';
        // Scroll to bottom when opening
        setTimeout(scrollChatToBottom, 100);
    }
}

// Send chat message
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (!currentUser) {
        showToast('Authentication Required', 'Please login to send messages.', 'warning');
        showAuthModal('login');
        return;
    }

    if (!socket || !socket.connected) {
        showToast('Connection Error', 'Chat is not connected. Please try again.', 'error');
        return;
    }

    // Emit message through socket
    socket.emit('send_message', {
        userId: currentUser.id,
        username: currentUser.username,
        message: message,
        messageType: currentUser.role === 'admin' ? 'admin' : 'user'
    });

    // Clear input
    messageInput.value = '';
    
    // Resize textarea if needed
    messageInput.style.height = 'auto';
}

// Add message to chat display
function addMessageToChat(messageData) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageElement = createMessageElement(messageData);
    messagesContainer.appendChild(messageElement);
    
    // Keep only last 100 messages for performance
    const messages = messagesContainer.children;
    if (messages.length > 100) {
        messages[0].remove();
    }
    
    // Scroll to bottom
    scrollChatToBottom();
    
    // Add to local array
    chatMessages.push(messageData);
}

// Create message element
function createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${messageData.messageType || 'user'}`;
    
    const avatar = createMessageAvatar(messageData.username, messageData.messageType);
    const timestamp = new Date(messageData.timestamp || Date.now()).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(messageData.username)}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-text">${escapeHtml(messageData.message)}</div>
        </div>
    `;

    return messageDiv;
}

// Create message avatar
function createMessageAvatar(username, messageType) {
    const initial = username ? username.charAt(0).toUpperCase() : '?';
    const avatarClass = messageType === 'admin' ? 'admin-avatar' : 'user-avatar';
    
    return `
        <div class="message-avatar ${avatarClass}">
            ${messageType === 'system' ? '<i class="fas fa-robot"></i>' : initial}
        </div>
    `;
}

// Add system message
function addSystemMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <p>${escapeHtml(message)}</p>
    `;

    messagesContainer.appendChild(systemDiv);
    scrollChatToBottom();
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Load chat history
async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat/history?limit=50');
        if (!response.ok) return;

        const data = await response.json();
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!messagesContainer) return;

        // Clear existing messages except system message
        const systemMessage = messagesContainer.querySelector('.system-message');
        messagesContainer.innerHTML = '';
        if (systemMessage) {
            messagesContainer.appendChild(systemMessage);
        }

        // Add historical messages
        data.messages.forEach(message => {
            const messageElement = createMessageElement({
                username: message.username,
                message: message.message,
                messageType: message.message_type,
                timestamp: message.created_at
            });
            messagesContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        scrollChatToBottom();
        
        chatMessages = data.messages;
    } catch (error) {
        console.error('Load chat history error:', error);
    }
}

// Update chat status indicator
function updateChatStatus(isOnline) {
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
        indicator.classList.toggle('online', isOnline);
        indicator.classList.toggle('offline', !isOnline);
    }
    
    // Update status text in chat header
    const chatTitle = document.querySelector('.chat-title span');
    if (chatTitle) {
        chatTitle.textContent = isOnline ? 'Live Support' : 'Support (Offline)';
    }
}

// Admin: Send admin message
function sendAdminMessage(message) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!socket || !socket.connected) {
        showToast('Connection Error', 'Chat is not connected.', 'error');
        return;
    }

    socket.emit('admin_message', {
        userId: currentUser.id,
        username: currentUser.username,
        message: message
    });
}

// Clear chat history (admin only)
async function clearChatHistory() {
    if (!requireAdmin()) return;

    const confirm = window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.');
    if (!confirm) return;

    try {
        showLoading();
        
        const response = await apiRequest('/api/admin/chat/clear', {
            method: 'DELETE'
        });

        if (response && response.ok) {
            // Clear local chat
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="system-message">
                        <i class="fas fa-robot"></i>
                        <p>Chat history has been cleared.</p>
                    </div>
                `;
            }
            
            chatMessages = [];
            showToast('Success', 'Chat history cleared successfully.', 'success');
        }
    } catch (error) {
        console.error('Clear chat error:', error);
        showToast('Error', 'Failed to clear chat history.', 'error');
    } finally {
        hideLoading();
    }
}

// Export chat to file (admin only)
async function exportChatHistory() {
    if (!requireAdmin()) return;

    try {
        showLoading();
        
        const response = await fetch('/api/chat/history?limit=1000', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('agroph_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export chat history');
        }

        const data = await response.json();
        
        // Create CSV content
        const csvContent = [
            'Timestamp,Username,Message Type,Message',
            ...data.messages.map(msg => 
                `"${msg.created_at}","${msg.username}","${msg.message_type}","${msg.message.replace(/"/g, '""')}"`
            )
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `agroph-chat-history-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Success', 'Chat history exported successfully.', 'success');
        
    } catch (error) {
        console.error('Export chat error:', error);
        showToast('Error', 'Failed to export chat history.', 'error');
    } finally {
        hideLoading();
    }
}

// Handle chat widget resize
function resizeChatWidget() {
    const chatWidget = document.getElementById('chat-widget');
    const messagesContainer = document.getElementById('chat-messages');
    
    if (window.innerWidth <= 768) {
        // Mobile layout
        chatWidget.style.width = 'calc(100vw - 2rem)';
        chatWidget.style.right = '1rem';
        chatWidget.style.left = '1rem';
    } else {
        // Desktop layout
        chatWidget.style.width = '350px';
        chatWidget.style.right = '2rem';
        chatWidget.style.left = 'auto';
    }
    
    // Scroll to bottom after resize
    setTimeout(scrollChatToBottom, 100);
}

// Listen for window resize
window.addEventListener('resize', debounce(resizeChatWidget, 250));

// Typing indicator (future enhancement)
let typingTimeout;
function showTypingIndicator(username) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // Remove existing typing indicator
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Add new typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            ${username.charAt(0).toUpperCase()}
        </div>
        <div class="typing-content">
            <span class="typing-text">${escapeHtml(username)} is typing...</span>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    messagesContainer.appendChild(typingDiv);
    scrollChatToBottom();

    // Remove after 3 seconds
    setTimeout(() => {
        if (typingDiv.parentNode) {
            typingDiv.remove();
        }
    }, 3000);
}

// Handle message input typing (for future typing indicators)
function handleMessageInputTyping() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('input', () => {
        if (!currentUser || !socket) return;
        
        // Clear previous timeout
        clearTimeout(typingTimeout);
        
        // Emit typing start
        socket.emit('typing_start', {
            username: currentUser.username
        });
        
        // Set timeout to emit typing stop
        typingTimeout = setTimeout(() => {
            socket.emit('typing_stop', {
                username: currentUser.username
            });
        }, 1000);
    });
}

// Format chat timestamp
function formatChatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // If this week, show day and time
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return date.toLocaleDateString('en-PH', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle chat message reactions (future enhancement)
function addMessageReaction(messageId, reaction) {
    if (!currentUser) return;
    
    // This would emit a socket event for message reactions
    socket.emit('message_reaction', {
        messageId: messageId,
        reaction: reaction,
        userId: currentUser.id
    });
}

// Admin chat controls
function showAdminChatControls() {
    if (!isAdmin()) return;

    const modalHTML = `
        <div class="modal-overlay" id="admin-chat-modal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Chat Administration</h2>
                    <button class="modal-close" onclick="closeModal('admin-chat-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="admin-chat-controls">
                        <button class="btn btn-primary btn-full" onclick="sendAdminAnnouncement()">
                            <i class="fas fa-bullhorn"></i>
                            Send Announcement
                        </button>
                        
                        <button class="btn btn-outline btn-full" onclick="exportChatHistory()">
                            <i class="fas fa-download"></i>
                            Export Chat History
                        </button>
                        
                        <button class="btn btn-danger btn-full" onclick="clearChatHistory()">
                            <i class="fas fa-trash"></i>
                            Clear Chat History
                        </button>
                    </div>
                    
                    <div class="quick-responses">
                        <h4>Quick Responses</h4>
                        <div class="quick-response-buttons">
                            <button class="btn btn-outline btn-sm" onclick="sendQuickResponse('Hello! How can I help you today?')">
                                Greeting
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="sendQuickResponse('Thank you for using AgroPH! Is there anything else I can help you with?')">
                                Thank You
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="sendQuickResponse('Please check our document center for the latest forms and resources.')">
                                Document Help
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="sendQuickResponse('For technical issues, please provide more details about the problem you are experiencing.')">
                                Tech Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('admin-chat-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    document.getElementById('admin-chat-modal').classList.add('show');

    // Close modal when clicking overlay
    document.getElementById('admin-chat-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-chat-modal') {
            closeModal('admin-chat-modal');
        }
    });
}

// Send quick response (admin)
function sendQuickResponse(message) {
    if (!isAdmin()) return;
    
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = message;
        sendMessage();
    }
    
    closeModal('admin-chat-modal');
}

// Send admin announcement
function sendAdminAnnouncement() {
    if (!isAdmin()) return;

    const message = prompt('Enter announcement message:');
    if (!message) return;

    const announcementMessage = `📢 ANNOUNCEMENT: ${message}`;
    sendAdminMessage(announcementMessage);
    
    closeModal('admin-chat-modal');
}

// Handle chat when user authentication changes
function onAuthenticationChange(isAuthenticated) {
    const chatLoginPrompt = document.getElementById('chat-login-prompt');
    const chatInput = document.getElementById('chat-input');
    
    if (isAuthenticated && currentUser) {
        chatLoginPrompt.style.display = 'none';
        chatInput.style.display = 'flex';
        
        // Join chat room
        if (socket && socket.connected) {
            socket.emit('join_chat', currentUser);
        }
    } else {
        chatLoginPrompt.style.display = 'block';
        chatInput.style.display = 'none';
    }
}

// Add chat context menu (right-click options)
function addChatContextMenu() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const messageElement = e.target.closest('.chat-message');
        if (!messageElement || !isAdmin()) return;

        // Show context menu for admin actions
        showChatContextMenu(e.clientX, e.clientY, messageElement);
    });
}

// Show chat context menu (admin only)
function showChatContextMenu(x, y, messageElement) {
    if (!isAdmin()) return;

    // Remove existing context menu
    const existingMenu = document.getElementById('chat-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const contextMenu = document.createElement('div');
    contextMenu.id = 'chat-context-menu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.zIndex = '3000';
    
    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="deleteChatMessage(this)">
            <i class="fas fa-trash"></i>
            Delete Message
        </div>
        <div class="context-menu-item" onclick="reportChatMessage(this)">
            <i class="fas fa-flag"></i>
            Report Message
        </div>
    `;

    document.body.appendChild(contextMenu);

    // Remove context menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeContextMenu() {
            contextMenu.remove();
            document.removeEventListener('click', removeContextMenu);
        });
    }, 100);
}

// Initialize chat when authentication state changes
document.addEventListener('authStateChanged', onAuthenticationChange);

// Export chat functions
window.ChatModule = {
    toggleChat,
    sendMessage,
    addMessageToChat,
    addSystemMessage,
    loadChatHistory,
    updateChatStatus,
    sendAdminMessage,
    clearChatHistory,
    exportChatHistory,
    showAdminChatControls
};