const express = require('express');
const router = express.Router();
const upload = require('../utils/uploadHandler');

router.post('/one_file', function (req, res) {
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'file khong duoc de trong'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upload 1 file thanh cong',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size
      }
    });
  });
});

router.post('/multiple_files', function (req, res) {
  upload.array('files', 10)(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'file khong duoc de trong'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upload nhieu file thanh cong',
      data: req.files.map((f) => ({
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        path: f.path,
        size: f.size
      }))
    });
  });
});

module.exports = router;