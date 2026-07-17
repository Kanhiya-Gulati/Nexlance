/**
 * @fileoverview Job Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for creating, reading, updating, and deleting jobs.
 * Public listing/detail endpoints and client-only mutation endpoints.
 *
 * @module routes/jobRoutes
 */

const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs (with optional filters/pagination)
 * @access  Public
 */
router.get('/', getJobs);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a single job by ID
 * @access  Public
 */
router.get('/:id', getJob);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (client only)
 */
router.post('/', protect, authorize('client'), createJob);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update an existing job posting
 * @access  Private (client only — must be job owner)
 */
router.put('/:id', protect, authorize('client'), updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job posting
 * @access  Private (client only — must be job owner)
 */
router.delete('/:id', protect, authorize('client'), deleteJob);

/**
 * @route   PATCH /api/jobs/:id/status
 * @desc    Update the status of a job (e.g., open, in-progress, closed)
 * @access  Private (client only — must be job owner)
 */
router.patch('/:id/status', protect, authorize('client'), updateJobStatus);

module.exports = router;
