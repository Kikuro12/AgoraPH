const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        // Get overall statistics
        const userStats = await query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
            FROM users
        `);

        const documentStats = await query(`
            SELECT 
                COUNT(*) as total_documents,
                SUM(download_count) as total_downloads,
                COUNT(CASE WHEN is_featured THEN 1 END) as featured_documents
            FROM documents WHERE is_active = true
        `);

        const forumStats = await query(`
            SELECT 
                COUNT(DISTINCT fp.id) as total_posts,
                COUNT(DISTINCT fr.id) as total_replies,
                COUNT(CASE WHEN fp.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as posts_today
            FROM forum_posts fp
            LEFT JOIN forum_replies fr ON fp.id = fr.post_id
        `);

        const chatStats = await query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN is_read = false AND message_type = 'user' THEN 1 END) as unread_messages,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as messages_today
            FROM chat_messages
        `);

        // Get recent activity
        const recentUsers = await query(`
            SELECT username, full_name, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const recentDocuments = await query(`
            SELECT d.title, d.download_count, d.created_at, u.username as uploaded_by
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.is_active = true
            ORDER BY d.created_at DESC
            LIMIT 5
        `);

        const recentPosts = await query(`
            SELECT fp.title, fp.created_at, u.username as author
            FROM forum_posts fp
            LEFT JOIN users u ON fp.author_id = u.id
            ORDER BY fp.created_at DESC
            LIMIT 5
        `);

        res.json({
            statistics: {
                users: userStats.rows[0],
                documents: documentStats.rows[0],
                forum: forumStats.rows[0],
                chat: chatStats.rows[0]
            },
            recentActivity: {
                users: recentUsers.rows,
                documents: recentDocuments.rows,
                posts: recentPosts.rows
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT id, username, email, full_name, role, location, is_active, created_at
            FROM users
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            queryText += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        if (role) {
            paramCount++;
            queryText += ` AND role = $${paramCount}`;
            queryParams.push(role);
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (username ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR full_name ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        if (role) {
            countParamCount++;
            countQuery += ` AND role = $${countParamCount}`;
            countParams.push(role);
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount: totalCount,
                hasNext: offset + result.rows.length < totalCount,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const userId = req.params.id;

        const result = await query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, is_active',
            [isActive, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const result = await query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role',
            [role, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User role updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Get announcements
router.get('/announcements', async (req, res) => {
    try {
        const result = await query(`
            SELECT a.*, u.username as created_by_username
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
            ORDER BY a.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Failed to get announcements' });
    }
});

// Create announcement
router.post('/announcements', async (req, res) => {
    try {
        const { title, content, type } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const result = await query(`
            INSERT INTO announcements (title, content, type, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [title, content, type || 'info', req.user.userId]);

        res.status(201).json({
            message: 'Announcement created successfully',
            announcement: result.rows[0]
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
    try {
        const { title, content, type, isActive } = req.body;

        const result = await query(`
            UPDATE announcements 
            SET title = $1, content = $2, type = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `, [title, content, type, isActive, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json({
            message: 'Announcement updated successfully',
            announcement: result.rows[0]
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM announcements WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

// Get system logs (simplified version)
router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // For now, we'll return recent chat messages and forum activity as "logs"
        const chatLogs = await query(`
            SELECT 'chat' as type, username, message as content, created_at
            FROM chat_messages
            ORDER BY created_at DESC
            LIMIT 25
        `);

        const forumLogs = await query(`
            SELECT 'forum' as type, u.username, 
                   CONCAT('Posted: ', fp.title) as content, fp.created_at
            FROM forum_posts fp
            LEFT JOIN users u ON fp.author_id = u.id
            ORDER BY fp.created_at DESC
            LIMIT 25
        `);

        // Combine and sort by date
        const allLogs = [...chatLogs.rows, ...forumLogs.rows]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(offset, offset + parseInt(limit));

        res.json({
            logs: allLogs,
            pagination: {
                currentPage: parseInt(page),
                hasMore: allLogs.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to get system logs' });
    }
});

module.exports = router;