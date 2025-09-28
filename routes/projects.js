const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { featured, status } = req.query;
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (featured === 'true') {
      query += ' AND is_featured = true';
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [projects] = await pool.execute(query, params);

    // Parse JSON fields
    const parsedProjects = projects.map(project => ({
      ...project,
      technologies: JSON.parse(project.technologies || '[]'),
      gallery_images: JSON.parse(project.gallery_images || '[]')
    }));

    res.json({
      success: true,
      projects: parsedProjects
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [projects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [id]);

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = {
      ...projects[0],
      technologies: JSON.parse(projects[0].technologies || '[]'),
      gallery_images: JSON.parse(projects[0].gallery_images || '[]')
    };

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminMiddleware,
  upload.single('project_image'),
  body('title', 'Project title is required').notEmpty(),
  body('description', 'Project description is required').notEmpty()
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
      title,
      description,
      long_description,
      technologies,
      github_url,
      demo_url,
      is_featured,
      status,
      sort_order
    } = req.body;

    let image_url = null;
    if (req.file) {
      image_url = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    // Parse technologies if it's a string
    let tech_array = [];
    if (technologies) {
      try {
        tech_array = typeof technologies === 'string' ? JSON.parse(technologies) : technologies;
      } catch (e) {
        tech_array = technologies.split(',').map(t => t.trim());
      }
    }

    const [result] = await pool.execute(`
      INSERT INTO projects (title, description, long_description, technologies, image_url, 
                           github_url, demo_url, is_featured, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description,
      long_description || null,
      JSON.stringify(tech_array),
      image_url,
      github_url || null,
      demo_url || null,
      is_featured || false,
      status || 'completed',
      sort_order || 0
    ]);

    const [newProject] = await pool.execute('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    
    const project = {
      ...newProject[0],
      technologies: JSON.parse(newProject[0].technologies || '[]'),
      gallery_images: JSON.parse(newProject[0].gallery_images || '[]')
    };

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin)
router.put('/:id', [
  authMiddleware,
  adminMiddleware,
  upload.single('project_image'),
  body('title', 'Project title is required').notEmpty(),
  body('description', 'Project description is required').notEmpty()
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
    const {
      title,
      description,
      long_description,
      technologies,
      github_url,
      demo_url,
      is_featured,
      status,
      sort_order
    } = req.body;

    // Parse technologies if it's a string
    let tech_array = [];
    if (technologies) {
      try {
        tech_array = typeof technologies === 'string' ? JSON.parse(technologies) : technologies;
      } catch (e) {
        tech_array = technologies.split(',').map(t => t.trim());
      }
    }

    let updateQuery = `
      UPDATE projects SET 
      title = ?, description = ?, long_description = ?, technologies = ?, 
      github_url = ?, demo_url = ?, is_featured = ?, status = ?, sort_order = ?
    `;
    let updateValues = [
      title,
      description,
      long_description || null,
      JSON.stringify(tech_array),
      github_url || null,
      demo_url || null,
      is_featured || false,
      status || 'completed',
      sort_order || 0
    ];

    if (req.file) {
      // Get existing project image to delete old file
      const [existingProject] = await pool.execute('SELECT image_url FROM projects WHERE id = ?', [id]);
      if (existingProject.length > 0 && existingProject[0].image_url) {
        const oldImagePath = path.join(__dirname, '..', existingProject[0].image_url.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old project image:', oldImagePath);
          } catch (err) {
            console.error('Error deleting old project image:', err);
          }
        }
      }
      
      const image_url = `/${req.file.path.replace(/\\/g, '/')}`;
      updateQuery += ', image_url = ?';
      updateValues.push(image_url);
    }

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    const [result] = await pool.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    // Get project image to delete file
    const [project] = await pool.execute('SELECT image_url FROM projects WHERE id = ?', [id]);
    if (project.length > 0 && project[0].image_url) {
      const imagePath = path.join(__dirname, '..', project[0].image_url.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Deleted project image:', imagePath);
        } catch (err) {
          console.error('Error deleting project image:', err);
        }
      }
    }

    const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;