const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   GET /api/gallery
// @desc    Get all gallery images
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    let query = 'SELECT * FROM gallery WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured === 'true') {
      query += ' AND is_featured = true';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [gallery] = await pool.execute(query, params);

    // Parse JSON fields
    const parsedGallery = gallery.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]')
    }));

    res.json({
      success: true,
      gallery: parsedGallery
    });

  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gallery/categories
// @desc    Get all gallery categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM gallery WHERE category IS NOT NULL ORDER BY category'
    );

    res.json({
      success: true,
      categories: categories.map(cat => cat.category)
    });

  } catch (error) {
    console.error('Get gallery categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gallery
// @desc    Upload new gallery image
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  upload.single('gallery_image'),
  body('title', 'Title is required').notEmpty()
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const { title, description, category, tags, is_featured, sort_order } = req.body;

    const image_url = `/${req.file.path.replace(/\\/g, '/')}`;
    const thumbnail_url = image_url; // For now, use same image as thumbnail

    // Parse tags if it's a string
    let tag_array = [];
    if (tags) {
      try {
        tag_array = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        tag_array = tags.split(',').map(t => t.trim());
      }
    }

    const [result] = await pool.execute(`
      INSERT INTO gallery (title, description, image_url, thumbnail_url, category, tags, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description || null,
      image_url,
      thumbnail_url,
      category || null,
      JSON.stringify(tag_array),
      is_featured || false,
      sort_order || 0
    ]);

    const [newGalleryItem] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [result.insertId]);
    
    const galleryItem = {
      ...newGalleryItem[0],
      tags: JSON.parse(newGalleryItem[0].tags || '[]')
    };

    res.status(201).json({
      success: true,
      message: 'Gallery image uploaded successfully',
      gallery: galleryItem
    });

  } catch (error) {
    console.error('Upload gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery image
// @access  Private (Admin)
router.put('/:id', [
  authMiddleware,
  adminMiddleware,
  upload.single('gallery_image'),
  body('title', 'Title is required').notEmpty()
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
    const { title, description, category, tags, is_featured, sort_order } = req.body;

    // Parse tags if it's a string
    let tag_array = [];
    if (tags) {
      try {
        tag_array = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        tag_array = tags.split(',').map(t => t.trim());
      }
    }

    let updateQuery = `
      UPDATE gallery SET 
      title = ?, description = ?, category = ?, tags = ?, is_featured = ?, sort_order = ?
    `;
    let updateValues = [
      title,
      description || null,
      category || null,
      JSON.stringify(tag_array),
      is_featured || false,
      sort_order || 0
    ];

    if (req.file) {
      // Get existing gallery image to delete old file
      const [existingGallery] = await pool.execute('SELECT image_url FROM gallery WHERE id = ?', [id]);
      if (existingGallery.length > 0 && existingGallery[0].image_url) {
        const oldImagePath = path.join(__dirname, '..', existingGallery[0].image_url.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old gallery image:', oldImagePath);
          } catch (err) {
            console.error('Error deleting old gallery image:', err);
          }
        }
      }
      
      const image_url = `/${req.file.path.replace(/\\/g, '/')}`;
      updateQuery += ', image_url = ?, thumbnail_url = ?';
      updateValues.push(image_url, image_url);
    }

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    const [result] = await pool.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      message: 'Gallery image updated successfully'
    });

  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery image
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM gallery WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      message: 'Gallery image deleted successfully'
    });

  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;