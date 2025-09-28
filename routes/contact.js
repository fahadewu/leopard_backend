const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact message
// @access  Public
router.post('/', [
  body('name', 'Name is required').notEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('message', 'Message is required').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `, [name, email, subject || null, message]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! I\'ll get back to you soon.',
      messageId: result.insertId
    });

  } catch (error) {
    console.error('Send contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages
// @access  Private (Admin)
router.get('/messages', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [messages] = await pool.execute(query, params);

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/contact/messages/:id/status
// @desc    Update message status
// @access  Private (Admin)
router.put('/messages/:id/status', [
  authMiddleware,
  adminMiddleware,
  body('status', 'Status is required').isIn(['unread', 'read', 'replied'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.execute(
      'UPDATE contact_messages SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully'
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/contact/messages/:id
// @desc    Delete contact message
// @access  Private (Admin)
router.delete('/messages/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/contact/stats
// @desc    Get contact message statistics
// @access  Private (Admin)
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM contact_messages');
    const [unreadResult] = await pool.execute('SELECT COUNT(*) as unread FROM contact_messages WHERE status = "unread"');
    const [readResult] = await pool.execute('SELECT COUNT(*) as read FROM contact_messages WHERE status = "read"');
    const [repliedResult] = await pool.execute('SELECT COUNT(*) as replied FROM contact_messages WHERE status = "replied"');

    res.json({
      success: true,
      stats: {
        total: totalResult[0].total,
        unread: unreadResult[0].unread,
        read: readResult[0].read,
        replied: repliedResult[0].replied
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;