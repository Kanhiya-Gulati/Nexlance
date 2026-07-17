/**
 * @fileoverview Profile Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for viewing and updating user profiles,
 * including avatar image uploads via multer.
 *
 * @module routes/profileRoutes
 */

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  addReview,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   GET /api/profile/:id
 * @desc    Get a user's public profile by user ID
 * @access  Private (requires authentication)
 */
router.get('/:id', protect, getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update the current user's profile (bio, skills, etc.)
 * @access  Private
 */
router.put('/', protect, updateProfile);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload or update the current user's avatar image
 * @access  Private
 */
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

/**
 * @route   POST /api/profile/:id/review
 * @desc    Add a review to a freelancer's profile
 * @access  Private (Client only)
 */
router.post('/:id/review', protect, addReview);

module.exports = router;
