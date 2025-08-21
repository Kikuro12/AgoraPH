const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Database initialization
const initializeDatabase = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('✅ Database schema initialized');
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};

// Helper function for queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    initializeDatabase
};