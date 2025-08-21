const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get forum categories
router.get('/categories', async (req, res) => {
    try {
        const result = await query(`
            SELECT fc.*, 
                   COUNT(fp.id) as post_count,
                   MAX(fp.created_at) as last_post_date
            FROM forum_categories fc
            LEFT JOIN forum_posts fp ON fc.id = fp.category_id
            GROUP BY fc.id
            ORDER BY fc.name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get forum categories error:', error);
        res.status(500).json({ error: 'Failed to get forum categories' });
    }
});

// Get posts with pagination and filters
router.get('/posts', optionalAuth, async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10, pinned } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT fp.*, u.username as author_username, u.avatar_url as author_avatar,
                   fc.name as category_name, fc.color as category_color,
                   lr.username as last_reply_username
            FROM forum_posts fp
            LEFT JOIN users u ON fp.author_id = u.id
            LEFT JOIN forum_categories fc ON fp.category_id = fc.id
            LEFT JOIN users lr ON fp.last_reply_by = lr.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 0;

        // Add category filter
        if (category) {
            paramCount++;
            queryText += ` AND fp.category_id = $${paramCount}`;
            queryParams.push(category);
        }

        // Add search filter
        if (search) {
            paramCount++;
            queryText += ` AND (fp.title ILIKE $${paramCount} OR fp.content ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        // Add pinned filter
        if (pinned === 'true') {
            queryText += ` AND fp.is_pinned = true`;
        }

        // Add ordering and pagination
        queryText += ` ORDER BY fp.is_pinned DESC, fp.last_reply_at DESC NULLS LAST, fp.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM forum_posts fp WHERE 1=1`;
        const countParams = [];
        let countParamCount = 0;

        if (category) {
            countParamCount++;
            countQuery += ` AND fp.category_id = $${countParamCount}`;
            countParams.push(category);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (fp.title ILIKE $${countParamCount} OR fp.content ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        if (pinned === 'true') {
            countQuery += ` AND fp.is_pinned = true`;
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            posts: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount: totalCount,
                hasNext: offset + result.rows.length < totalCount,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Get single post with replies
router.get('/posts/:id', optionalAuth, async (req, res) => {
    try {
        // Get post details
        const postResult = await query(`
            SELECT fp.*, u.username as author_username, u.avatar_url as author_avatar,
                   fc.name as category_name, fc.color as category_color
            FROM forum_posts fp
            LEFT JOIN users u ON fp.author_id = u.id
            LEFT JOIN forum_categories fc ON fp.category_id = fc.id
            WHERE fp.id = $1
        `, [req.params.id]);

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = postResult.rows[0];

        // Get replies
        const repliesResult = await query(`
            SELECT fr.*, u.username as author_username, u.avatar_url as author_avatar
            FROM forum_replies fr
            LEFT JOIN users u ON fr.author_id = u.id
            WHERE fr.post_id = $1
            ORDER BY fr.created_at ASC
        `, [req.params.id]);

        // Increment view count
        await query('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);

        res.json({
            post: { ...post, view_count: post.view_count + 1 },
            replies: repliesResult.rows
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to get post' });
    }
});

// Create new post
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const result = await query(`
            INSERT INTO forum_posts (title, content, author_id, category_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [title, content, req.user.userId, categoryId || null]);

        res.status(201).json({
            message: 'Post created successfully',
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Create reply
router.post('/posts/:id/replies', authenticateToken, async (req, res) => {
    try {
        const { content, parentReplyId } = req.body;
        const postId = req.params.id;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Check if post exists
        const postCheck = await query('SELECT id FROM forum_posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Create reply
        const result = await query(`
            INSERT INTO forum_replies (content, author_id, post_id, parent_reply_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [content, req.user.userId, postId, parentReplyId || null]);

        // Update post reply count and last reply info
        await query(`
            UPDATE forum_posts 
            SET reply_count = reply_count + 1, 
                last_reply_at = CURRENT_TIMESTAMP,
                last_reply_by = $1
            WHERE id = $2
        `, [req.user.userId, postId]);

        res.status(201).json({
            message: 'Reply created successfully',
            reply: result.rows[0]
        });
    } catch (error) {
        console.error('Create reply error:', error);
        res.status(500).json({ error: 'Failed to create reply' });
    }
});

// Update post (author or admin only)
router.put('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;
        const postId = req.params.id;

        // Check if user can edit this post
        const postCheck = await query(
            'SELECT author_id FROM forum_posts WHERE id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = postCheck.rows[0];
        if (post.author_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to edit this post' });
        }

        const result = await query(`
            UPDATE forum_posts 
            SET title = $1, content = $2, category_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [title, content, categoryId || null, postId]);

        res.json({
            message: 'Post updated successfully',
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post (author or admin only)
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;

        // Check if user can delete this post
        const postCheck = await query(
            'SELECT author_id FROM forum_posts WHERE id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = postCheck.rows[0];
        if (post.author_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }

        // Delete all replies first
        await query('DELETE FROM forum_replies WHERE post_id = $1', [postId]);
        
        // Delete post
        await query('DELETE FROM forum_posts WHERE id = $1', [postId]);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Pin/Unpin post (admin only)
router.patch('/posts/:id/pin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isPinned } = req.body;
        
        const result = await query(
            'UPDATE forum_posts SET is_pinned = $1 WHERE id = $2 RETURNING *',
            [isPinned, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({
            message: `Post ${isPinned ? 'pinned' : 'unpinned'} successfully`,
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Pin post error:', error);
        res.status(500).json({ error: 'Failed to pin/unpin post' });
    }
});

// Lock/Unlock post (admin only)
router.patch('/posts/:id/lock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isLocked } = req.body;
        
        const result = await query(
            'UPDATE forum_posts SET is_locked = $1 WHERE id = $2 RETURNING *',
            [isLocked, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({
            message: `Post ${isLocked ? 'locked' : 'unlocked'} successfully`,
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Lock post error:', error);
        res.status(500).json({ error: 'Failed to lock/unlock post' });
    }
});

module.exports = router;