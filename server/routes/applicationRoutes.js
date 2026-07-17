/**
 * @fileoverview Application Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for freelancers to apply for jobs and for clients
 * to review and update the status of applications.
 *
 * @module routes/applicationRoutes
 */

const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  completeProject,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/applications
 * @desc    Submit a new application for a job
 * @access  Private (freelancer only)
 */
router.post('/', protect, authorize('freelancer'), applyForJob);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get all applications for a specific job
 * @access  Private (job owner or admin)
 */
router.get('/job/:jobId', protect, getJobApplications);

/**
 * @route   GET /api/applications/my
 * @desc    Get all applications submitted by the current freelancer
 * @access  Private (freelancer only)
 */
router.get('/my', protect, authorize('freelancer'), getMyApplications);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update an application's status (accepted, rejected, etc.)
 * @access  Private (client only — must own the associated job)
 */
router.patch('/:id/status', protect, authorize('client'), updateApplicationStatus);

/**
 * @route   PATCH /api/applications/complete/:jobId
 * @desc    Mark a project as completed
 * @access  Private (client only — must own the associated job)
 */
router.patch('/complete/:jobId', protect, authorize('client'), completeProject);

module.exports = router;
