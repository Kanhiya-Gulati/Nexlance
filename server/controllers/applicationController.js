const Application = require('../models/Application');
const Job = require('../models/Job');

/**
 * @desc    Apply for a job
 * @route   POST /api/applications
 * @access  Private (Freelancer only)
 */
const applyForJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter, proposedBudget, estimatedDuration } = req.body;

    // Verify job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      job: jobId,
      freelancer: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      freelancer: req.user._id,
      coverLetter,
      proposedBudget,
      estimatedDuration,
    });

    // Increment applications count on the job
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    // Populate and return
    const populatedApplication = await Application.findById(application._id)
      .populate('freelancer', 'name email avatar skills')
      .populate('job', 'title');

    res.status(201).json({
      success: true,
      application: populatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications for a specific job
 * @route   GET /api/applications/job/:jobId
 * @access  Private (Client owner only)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to the requesting client
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job',
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate('freelancer', 'name email avatar skills bio experience')
      .populate('job', 'title');

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by the logged-in freelancer
 * @route   GET /api/applications/my
 * @access  Private (Freelancer only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      freelancer: req.user._id,
    })
      .populate({
        path: 'job',
        select: 'title category budgetMin budgetMax status client',
        populate: {
          path: 'client',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status (accept/reject)
 * @route   PATCH /api/applications/:id/status
 * @access  Private (Client only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either accepted or rejected',
      });
    }

    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify the job belongs to the requesting client
    if (application.job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application',
      });
    }

    // Update application status
    application.status = status;
    await application.save();

    // If accepted, update job and reject other pending applications
    if (status === 'accepted') {
      // Update job status and assign freelancer
      await Job.findByIdAndUpdate(application.job._id, {
        status: 'in-progress',
        assignedFreelancer: application.freelancer,
      });

      // Reject all other pending applications for the same job
      await Application.updateMany(
        {
          job: application.job._id,
          _id: { $ne: application._id },
          status: 'pending',
        },
        { status: 'rejected' }
      );
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a project as completed
 * @route   PATCH /api/applications/complete/:jobId
 * @access  Private (Client only)
 */
const completeProject = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Find the job and verify the requesting user is the client who owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this project',
      });
    }

    // Verify job status is 'in-progress'
    if (job.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress projects can be marked as completed',
      });
    }

    // Update job status to 'completed'
    job.status = 'completed';
    await job.save();

    // Find the accepted application for this job and update its status to 'completed'
    await Application.findOneAndUpdate(
      { job: jobId, status: 'accepted' },
      { status: 'completed' }
    );

    res.status(200).json({
      success: true,
      message: 'Project marked as completed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  completeProject,
};
