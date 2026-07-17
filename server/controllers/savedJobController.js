const User = require('../models/User');
const Job = require('../models/Job');

/**
 * @desc    Toggle save/unsave a job for the current user
 * @route   POST /api/saved-jobs/:jobId
 * @access  Private
 */
const toggleSaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const user = await User.findById(req.user._id);

    // Check if job is already saved
    const isAlreadySaved = user.savedJobs.includes(jobId);

    if (isAlreadySaved) {
      // Remove job from saved list
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { savedJobs: jobId },
      });
    } else {
      // Add job to saved list (prevent duplicates)
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { savedJobs: jobId },
      });
    }

    // Get updated user
    const updatedUser = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      saved: !isAlreadySaved,
      savedJobs: updatedUser.savedJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all saved jobs for the current user
 * @route   GET /api/saved-jobs
 * @access  Private
 */
const getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedJobs',
      populate: {
        path: 'client',
        select: 'name email avatar',
      },
    });

    res.status(200).json({
      success: true,
      savedJobs: user.savedJobs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleSaveJob, getSavedJobs };
