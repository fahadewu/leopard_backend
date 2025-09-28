const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/education
// @desc    Get all education records
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [education] = await pool.execute(
      'SELECT * FROM education ORDER BY end_date DESC, start_date DESC'
    );

    res.json({
      success: true,
      education
    });

  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/education
// @desc    Create new education record
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  body('institution', 'Institution is required').notEmpty(),
  body('degree', 'Degree is required').notEmpty()
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

    const {
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      is_current,
      description,
      grade,
      activities,
      sort_order
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO education (institution, degree, field_of_study, start_date, end_date, 
                           is_current, description, grade, activities, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      institution,
      degree,
      field_of_study || null,
      start_date || null,
      end_date || null,
      is_current || false,
      description || null,
      grade || null,
      activities || null,
      sort_order || 0
    ]);

    const [newEducation] = await pool.execute('SELECT * FROM education WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Education record created successfully',
      education: newEducation[0]
    });

  } catch (error) {
    console.error('Create education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/education/:id
// @desc    Update education record
// @access  Private (Admin)
router.put('/:id', [
  authMiddleware,
  adminMiddleware,
  body('institution', 'Institution is required').notEmpty(),
  body('degree', 'Degree is required').notEmpty()
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
    const {
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      is_current,
      description,
      grade,
      activities,
      sort_order
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE education SET 
      institution = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ?, 
      is_current = ?, description = ?, grade = ?, activities = ?, sort_order = ?
      WHERE id = ?
    `, [
      institution,
      degree,
      field_of_study || null,
      start_date || null,
      end_date || null,
      is_current || false,
      description || null,
      grade || null,
      activities || null,
      sort_order || 0,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }

    res.json({
      success: true,
      message: 'Education record updated successfully'
    });

  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/education/:id
// @desc    Delete education record
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM education WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }

    res.json({
      success: true,
      message: 'Education record deleted successfully'
    });

  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;