const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only documents are allowed.'), false);
        }
    }
});

// Get all document categories
router.get('/categories', async (req, res) => {
    try {
        const result = await query('SELECT * FROM document_categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get documents with search and filter
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, category, page = 1, limit = 12, featured } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT d.*, dc.name as category_name, dc.color as category_color, dc.icon as category_icon,
                   u.username as uploaded_by_username
            FROM documents d
            LEFT JOIN document_categories dc ON d.category_id = dc.id
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.is_active = true
        `;
        const queryParams = [];
        let paramCount = 0;

        // Add search filter
        if (search) {
            paramCount++;
            queryText += ` AND (d.title ILIKE $${paramCount} OR d.description ILIKE $${paramCount} OR $${paramCount} = ANY(d.tags))`;
            queryParams.push(`%${search}%`);
        }

        // Add category filter
        if (category) {
            paramCount++;
            queryText += ` AND d.category_id = $${paramCount}`;
            queryParams.push(category);
        }

        // Add featured filter
        if (featured === 'true') {
            queryText += ` AND d.is_featured = true`;
        }

        // Add ordering and pagination
        queryText += ` ORDER BY d.is_featured DESC, d.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) FROM documents d
            WHERE d.is_active = true
        `;
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (d.title ILIKE $${countParamCount} OR d.description ILIKE $${countParamCount} OR $${countParamCount} = ANY(d.tags))`;
            countParams.push(`%${search}%`);
        }

        if (category) {
            countParamCount++;
            countQuery += ` AND d.category_id = $${countParamCount}`;
            countParams.push(category);
        }

        if (featured === 'true') {
            countQuery += ` AND d.is_featured = true`;
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            documents: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount: totalCount,
                hasNext: offset + result.rows.length < totalCount,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to get documents' });
    }
});

// Get single document
router.get('/:id', async (req, res) => {
    try {
        const result = await query(`
            SELECT d.*, dc.name as category_name, dc.color as category_color, dc.icon as category_icon,
                   u.username as uploaded_by_username
            FROM documents d
            LEFT JOIN document_categories dc ON d.category_id = dc.id
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.id = $1 AND d.is_active = true
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to get document' });
    }
});

// Download document
router.get('/:id/download', async (req, res) => {
    try {
        const result = await query(
            'SELECT file_path, filename FROM documents WHERE id = $1 AND is_active = true',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const document = result.rows[0];
        const filePath = path.join(__dirname, '..', document.file_path);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Increment download count
        await query(
            'UPDATE documents SET download_count = download_count + 1 WHERE id = $1',
            [req.params.id]
        );

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Send file
        res.sendFile(filePath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Upload document (admin only)
router.post('/upload', authenticateToken, requireAdmin, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, description, categoryId, tags, isFeatured } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Document title is required' });
        }

        // Parse tags
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        // Insert document record
        const result = await query(`
            INSERT INTO documents (title, description, filename, file_path, file_size, file_type, category_id, uploaded_by, tags, is_featured)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            title,
            description || null,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            categoryId || null,
            req.user.userId,
            tagArray,
            isFeatured === 'true'
        ]);

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: result.rows[0]
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up uploaded file if database insert failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Update document (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, categoryId, tags, isFeatured } = req.body;
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        const result = await query(`
            UPDATE documents 
            SET title = $1, description = $2, category_id = $3, tags = $4, is_featured = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND is_active = true
            RETURNING *
        `, [title, description, categoryId || null, tagArray, isFeatured === 'true', req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({
            message: 'Document updated successfully',
            document: result.rows[0]
        });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// Delete document (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await query(
            'UPDATE documents SET is_active = false WHERE id = $1 RETURNING file_path',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Get document statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_documents,
                SUM(download_count) as total_downloads,
                COUNT(CASE WHEN is_featured THEN 1 END) as featured_documents,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_documents
            FROM documents WHERE is_active = true
        `);

        const categoryStats = await query(`
            SELECT dc.name, COUNT(d.id) as document_count
            FROM document_categories dc
            LEFT JOIN documents d ON dc.id = d.category_id AND d.is_active = true
            GROUP BY dc.id, dc.name
            ORDER BY document_count DESC
        `);

        res.json({
            overview: stats.rows[0],
            categories: categoryStats.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;