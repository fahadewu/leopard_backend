const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all skills
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { featured } = req.query;
    let query = 'SELECT * FROM skills';
    const params = [];

    if (featured === 'true') {
      query += ' WHERE is_featured = true';
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const [skills] = await pool.execute(query, params);

    res.json({
      success: true,
      skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/skills
// @desc    Create new skill
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  body('name', 'Skill name is required').notEmpty(),
  body('level', 'Level must be between 0 and 100').isInt({ min: 0, max: 100 })
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

    const { name, level, category, icon, is_featured, sort_order } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO skills (name, level, category, icon, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, level, category || null, icon || null, is_featured || false, sort_order || 0]);

    const [newSkill] = await pool.execute('SELECT * FROM skills WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      skill: newSkill[0]
    });

  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/skills/:id
// @desc    Update skill
// @access  Private (Admin)
router.put('/:id', [
  authMiddleware,
  adminMiddleware,
  body('name', 'Skill name is required').notEmpty(),
  body('level', 'Level must be between 0 and 100').isInt({ min: 0, max: 100 })
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
    const { name, level, category, icon, is_featured, sort_order } = req.body;

    const [result] = await pool.execute(`
      UPDATE skills SET 
      name = ?, level = ?, category = ?, icon = ?, is_featured = ?, sort_order = ?
      WHERE id = ?
    `, [name, level, category || null, icon || null, is_featured || false, sort_order || 0, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill updated successfully'
    });

  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete skill
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM skills WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });

  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;