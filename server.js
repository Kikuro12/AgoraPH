const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database and routes
const { initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const forumRoutes = require('./routes/forum');
const weatherRoutes = require('./routes/weather');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.openweathermap.org"],
            frameSrc: ["'self'"]
        }
    }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join chat room
    socket.on('join_chat', (userData) => {
        socket.userData = userData;
        socket.join('main_chat');
        socket.to('main_chat').emit('user_joined', {
            username: userData.username,
            message: `${userData.username} joined the chat`
        });
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
        try {
            const { query } = require('./config/database');
            
            // Save message to database
            await query(
                'INSERT INTO chat_messages (user_id, username, message, message_type) VALUES ($1, $2, $3, $4)',
                [data.userId, data.username, data.message, data.messageType || 'user']
            );

            // Broadcast message to all users
            io.to('main_chat').emit('receive_message', {
                id: Date.now(),
                username: data.username,
                message: data.message,
                messageType: data.messageType || 'user',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Chat message error:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle admin messages
    socket.on('admin_message', async (data) => {
        if (socket.userData && socket.userData.role === 'admin') {
            try {
                const { query } = require('./config/database');
                
                await query(
                    'INSERT INTO chat_messages (user_id, username, message, message_type) VALUES ($1, $2, $3, $4)',
                    [data.userId, data.username, data.message, 'admin']
                );

                io.to('main_chat').emit('receive_message', {
                    id: Date.now(),
                    username: data.username,
                    message: data.message,
                    messageType: 'admin',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Admin message error:', error);
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userData) {
            socket.to('main_chat').emit('user_left', {
                username: socket.userData.username,
                message: `${socket.userData.username} left the chat`
            });
        }
        console.log('User disconnected:', socket.id);
    });
});

// Serve main application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Create uploads directory
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        server.listen(PORT, () => {
            console.log(`🚀 AgroPH server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = { app, server, io };