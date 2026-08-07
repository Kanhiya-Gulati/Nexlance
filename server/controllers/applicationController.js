const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

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

    // Send email notification to client in background
    const jobWithClient = await Job.findById(jobId).populate('client', 'name email');
    if (jobWithClient && jobWithClient.client && jobWithClient.client.email) {
      sendEmail({
        to: jobWithClient.client.email,
        subject: `📥 New Proposal Received for "${jobWithClient.title}"`,
        html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">New Proposal Received 📥</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Hi <strong>${jobWithClient.client.name}</strong>,<br/><br/>You have received a new proposal for your job <strong>"${jobWithClient.title}"</strong> from <strong>${req.user.name}</strong>.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="color: #4f46e5; font-size: 16px; margin: 0 0 8px; font-weight: 700;">Proposed Budget: ₹${proposedBudget}</p>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;"><strong>Cover Letter:</strong> "${coverLetter}"</p>
      </div>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/client" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">Review Proposals</a>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
      }).catch((err) => console.error('Error sending proposal email to client:', err.message));
    }

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

    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('freelancer', 'name email');

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
        assignedFreelancer: application.freelancer._id,
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

      // Send Congratulations email to Freelancer
      if (application.freelancer && application.freelancer.email) {
        sendEmail({
          to: application.freelancer.email,
          subject: `🎉 Congratulations! Your Proposal for "${application.job.title}" was Accepted`,
          html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Proposal Accepted!</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Congratulations ${application.freelancer.name}! 🎉</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Great news! Your proposal for <strong>"${application.job.title}"</strong> has been accepted by client <strong>${req.user.name}</strong>.</p>
      <div style="background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 700;">Status: HIRED & PROJECT IN PROGRESS 🚀</p>
      </div>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/freelancer" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Workspace & Chat</a>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
        }).catch((err) => console.error('Error sending proposal acceptance email:', err.message));
      }
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
    const job = await Job.findById(jobId).populate('assignedFreelancer', 'name email');
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

    // Send Project Completed email to Freelancer
    if (job.assignedFreelancer && job.assignedFreelancer.email) {
      sendEmail({
        to: job.assignedFreelancer.email,
        subject: `🏆 Project Completed! "${job.title}"`,
        html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Project Completed</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Project Completed! 🏆</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Hi <strong>${job.assignedFreelancer.name}</strong>,<br/><br/>Congratulations! Client <strong>${req.user.name}</strong> has marked the project <strong>"${job.title}"</strong> as successfully completed.</p>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
      }).catch((err) => console.error('Error sending project completed email:', err.message));
    }

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
