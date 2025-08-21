const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        // Check database connection
        const dbResult = await query('SELECT NOW() as timestamp');
        
        // Basic system info
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                timestamp: dbResult.rows[0].timestamp
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                environment: process.env.NODE_ENV || 'development'
            },
            features: {
                authentication: true,
                documents: true,
                forum: true,
                chat: true,
                weather: !!process.env.WEATHER_API_KEY,
                admin: true
            }
        };

        res.json(healthData);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                connected: false
            }
        });
    }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
    res.json({ 
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;