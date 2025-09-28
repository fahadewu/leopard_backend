const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get profile information
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [profiles] = await pool.execute('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
    
    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile: profiles[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile
// @desc    Update profile information
// @access  Private (Admin)
router.put('/', [
  authMiddleware,
  adminMiddleware,
  upload.single('profile_image'),
  body('name', 'Name is required').notEmpty(),
  body('title', 'Title is required').notEmpty(),
  body('email', 'Please include a valid email').isEmail()
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

    const {
      name,
      title,
      bio,
      email,
      phone,
      location,
      resume_url,
      github_url,
      linkedin_url,
      twitter_url
    } = req.body;

    let profile_image = null;
    if (req.file) {
      profile_image = `/${req.file.path.replace(/\\/g, '/')}`;
      
      // Get existing profile image to delete old file
      const [existingProfile] = await pool.execute('SELECT profile_image FROM profile LIMIT 1');
      if (existingProfile.length > 0 && existingProfile[0].profile_image) {
        const oldImagePath = path.join(__dirname, '..', existingProfile[0].profile_image.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old profile image:', oldImagePath);
          } catch (err) {
            console.error('Error deleting old profile image:', err);
          }
        }
      }
    }

    // Check if profile exists
    const [existingProfile] = await pool.execute('SELECT id FROM profile LIMIT 1');
    
    if (existingProfile.length === 0) {
      // Create new profile
      const [result] = await pool.execute(`
        INSERT INTO profile (name, title, bio, email, phone, location, resume_url, profile_image, github_url, linkedin_url, twitter_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, title, bio, email, phone, location, resume_url, profile_image, github_url, linkedin_url, twitter_url]);
      
      res.json({
        success: true,
        message: 'Profile created successfully',
        profile: { id: result.insertId, ...req.body, profile_image }
      });
    } else {
      // Update existing profile
      let updateQuery = `
        UPDATE profile SET 
        name = ?, title = ?, bio = ?, email = ?, phone = ?, location = ?, 
        resume_url = ?, github_url = ?, linkedin_url = ?, twitter_url = ?
      `;
      let updateValues = [name, title, bio, email, phone, location, resume_url, github_url, linkedin_url, twitter_url];
      
      if (profile_image) {
        updateQuery += ', profile_image = ?';
        updateValues.push(profile_image);
      }
      
      updateQuery += ' WHERE id = ?';
      updateValues.push(existingProfile[0].id);

      await pool.execute(updateQuery, updateValues);

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    }

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;