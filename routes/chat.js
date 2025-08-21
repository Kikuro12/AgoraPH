const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get chat history
router.get('/history', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const result = await query(`
            SELECT cm.*, u.avatar_url as user_avatar
            FROM chat_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            ORDER BY cm.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        // Reverse to show oldest first
        const messages = result.rows.reverse();

        res.json({
            messages: messages,
            hasMore: result.rows.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

// Get unread message count (admin only)
router.get('/unread-count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await query(
            'SELECT COUNT(*) as unread_count FROM chat_messages WHERE is_read = false AND message_type = \'user\''
        );

        res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark messages as read (admin only)
router.patch('/mark-read', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { messageIds } = req.body;

        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ error: 'Message IDs array is required' });
        }

        await query(
            'UPDATE chat_messages SET is_read = true WHERE id = ANY($1)',
            [messageIds]
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Delete chat message (admin only)
router.delete('/messages/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM chat_messages WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Chat message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Get chat statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN message_type = 'admin' THEN 1 END) as admin_messages,
                COUNT(CASE WHEN is_read = false AND message_type = 'user' THEN 1 END) as unread_messages,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as messages_today
            FROM chat_messages
        `);

        const recentActivity = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as message_count
            FROM chat_messages
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json({
            overview: stats.rows[0],
            recentActivity: recentActivity.rows
        });
    } catch (error) {
        console.error('Get chat stats error:', error);
        res.status(500).json({ error: 'Failed to get chat statistics' });
    }
});

module.exports = router;