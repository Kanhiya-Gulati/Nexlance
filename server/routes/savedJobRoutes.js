/**
 * @fileoverview Saved Job Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for toggling job bookmarks and retrieving
 * the current user's saved jobs list.
 *
 * @module routes/savedJobRoutes
 */

const express = require('express');
const router = express.Router();
const {
  toggleSaveJob,
  getSavedJobs,
} = require('../controllers/savedJobController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/saved-jobs/:jobId
 * @desc    Toggle save/unsave a job for the authenticated user
 * @access  Private
 */
router.post('/:jobId', protect, toggleSaveJob);

/**
 * @route   GET /api/saved-jobs
 * @desc    Get all jobs saved by the authenticated user
 * @access  Private
 */
router.get('/', protect, getSavedJobs);

module.exports = router;
