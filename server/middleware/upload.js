const multer = require('multer');
const path = require('path');

/**
 * Multer configuration for avatar uploads
 * - Stores files in 'uploads/' directory
 * - Generates unique filenames with timestamps
 * - Restricts to image files only (JPEG, PNG, WebP)
 * - Limits file size to 5MB
 */

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `avatar-${Date.now()}-${file.originalname}`);
  },
});

// File filter - only allow image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, JPG, and WebP images are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
