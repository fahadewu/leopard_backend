const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   GET /api/testimonials
// @desc    Get all testimonials
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { featured } = req.query;
    let query = 'SELECT * FROM testimonials WHERE 1=1';
    const params = [];

    if (featured === 'true') {
      query += ' AND is_featured = true';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [testimonials] = await pool.execute(query, params);

    res.json({
      success: true,
      testimonials
    });

  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/testimonials
// @desc    Create new testimonial
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  upload.single('testimonial_avatar'),
  body('name', 'Name is required').notEmpty(),
  body('content', 'Content is required').notEmpty(),
  body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 })
], handleMulterError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, position, company, content, rating, is_featured, sort_order } = req.body;

    let avatar_url = null;
    if (req.file) {
      avatar_url = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    const [result] = await pool.execute(`
      INSERT INTO testimonials (name, position, company, content, avatar_url, rating, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, position || null, company || null, content, avatar_url, rating, is_featured || false, sort_order || 0]);

    const [newTestimonial] = await pool.execute('SELECT * FROM testimonials WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial: newTestimonial[0]
    });

  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/testimonials/:id
// @desc    Update testimonial
// @access  Private (Admin)
router.put('/:id', [
  authMiddleware,
  adminMiddleware,
  upload.single('testimonial_avatar'),
  body('name', 'Name is required').notEmpty(),
  body('content', 'Content is required').notEmpty(),
  body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 })
], handleMulterError, async (req, res) => {
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
    const { name, position, company, content, rating, is_featured, sort_order } = req.body;

    let updateQuery = `
      UPDATE testimonials SET 
      name = ?, position = ?, company = ?, content = ?, rating = ?, is_featured = ?, sort_order = ?
    `;
    let updateValues = [name, position || null, company || null, content, rating, is_featured || false, sort_order || 0];

    if (req.file) {
      // Get existing testimonial avatar to delete old file
      const [existingTestimonial] = await pool.execute('SELECT avatar_url FROM testimonials WHERE id = ?', [id]);
      if (existingTestimonial.length > 0 && existingTestimonial[0].avatar_url) {
        const oldImagePath = path.join(__dirname, '..', existingTestimonial[0].avatar_url.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old testimonial avatar:', oldImagePath);
          } catch (err) {
            console.error('Error deleting old testimonial avatar:', err);
          }
        }
      }
      
      const avatar_url = `/${req.file.path.replace(/\\/g, '/')}`;
      updateQuery += ', avatar_url = ?';
      updateValues.push(avatar_url);
    }

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    const [result] = await pool.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial updated successfully'
    });

  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete testimonial
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM testimonials WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });

  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;