const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Helper function to generate the correct base URL
const getBaseUrl = (req) => {
  const baseUrl = process.env.BACKEND_BASE_URL || `${req.protocol}://${req.get('host')}`;
  if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
    return baseUrl.replace('http://', 'https://');
  }
  return baseUrl;
};

// Upload single image
router.post('/single', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path.replace(/\\/g, '/');
    const publicPath = '/' + filePath;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: publicPath,
        url: `${getBaseUrl(req)}${publicPath}?t=${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file',
      error: error.message 
    });
  }
});

module.exports = router;
