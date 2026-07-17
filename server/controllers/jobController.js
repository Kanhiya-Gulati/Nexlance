const Job = require('../models/Job');
const Application = require('../models/Application');

/**
 * @desc    Get all jobs with filtering, search, and pagination
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      category,
      skills,
      budgetMin,
      budgetMax,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter = {};

    // Text search on title (case-insensitive regex)
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Skills filter (comma-separated)
    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      filter.skills = { $in: skillsArray };
    }

    // Budget range filters
    if (budgetMin) {
      filter.budgetMin = { $gte: Number(budgetMin) };
    }
    if (budgetMax) {
      filter.budgetMax = { $lte: Number(budgetMax) };
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population, sort, and pagination
    const jobs = await Job.find(filter)
      .populate('client', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNum);

    res.status(200).json({
      success: true,
      jobs,
      totalPages,
      currentPage: pageNum,
      totalJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'client',
      'name email avatar bio location'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (Client only)
 */
const createJob = async (req, res, next) => {
  try {
    const { title, description, category, skills, budgetMin, budgetMax, duration } = req.body;

    // Validate required fields
    if (!title || !description || !category || !skills || !budgetMin || !budgetMax || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, skills, budgetMin, budgetMax, duration',
      });
    }

    // Set the client to the authenticated user
    const job = await Job.create({
      title,
      description,
      category,
      skills: Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim()),
      budgetMin,
      budgetMax,
      duration,
      client: req.user._id,
    });

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job posting
 * @route   PUT /api/jobs/:id
 * @access  Private (Client owner only)
 */
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    // Update job with provided fields
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a job posting and its related applications
 * @route   DELETE /api/jobs/:id
 * @access  Private (Client owner only)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    // Delete all related applications
    await Application.deleteMany({ job: job._id });

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job and related applications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update job status (and optionally assign freelancer)
 * @route   PATCH /api/jobs/:id/status
 * @access  Private (Client owner only)
 */
const updateJobStatus = async (req, res, next) => {
  try {
    const { status, assignedFreelancer } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job status',
      });
    }

    // Update status
    job.status = status;

    // If setting to in-progress with an assigned freelancer
    if (status === 'in-progress' && assignedFreelancer) {
      job.assignedFreelancer = assignedFreelancer;
    }

    await job.save();

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
};
