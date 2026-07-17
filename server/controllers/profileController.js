const User = require('../models/User');
const Job = require('../models/Job');

/**
 * @desc    Get user profile by ID
 * @route   GET /api/profile/:id
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let jobs = [];
    if (user.role === 'client') {
      const allJobs = await Job.find({ client: user._id }).populate('assignedFreelancer', 'name avatar');
      const Application = require('../models/Application');
      jobs = await Promise.all(allJobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id });
        const jobObj = job.toObject();
        jobObj.applicationsCount = count;
        return jobObj;
      }));
    }

    res.status(200).json({
      success: true,
      user,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      bio,
      skills,
      experience,
      portfolioLinks,
      location,
      projects,
      languages,
      education,
      certifications,
      availability,
      minProjectBudget,
      preferredProjectType,
      phone,
      isEmailVerified,
      isPhoneVerified,
      reviews,
      stats,
      title,
      hourlyRate,
      links,
      industry,
      tagline,
      companySize,
      businessType,
      gstNumber,
      isPaymentVerified,
    } = req.body;

    // Build update object with only allowed fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (skills !== undefined) updateFields.skills = skills;
    if (experience !== undefined) updateFields.experience = experience;
    if (portfolioLinks !== undefined) updateFields.portfolioLinks = portfolioLinks;
    if (location !== undefined) updateFields.location = location;
    if (projects !== undefined) updateFields.projects = projects;
    if (languages !== undefined) updateFields.languages = languages;
    if (education !== undefined) updateFields.education = education;
    if (certifications !== undefined) updateFields.certifications = certifications;
    if (availability !== undefined) updateFields.availability = availability;
    if (minProjectBudget !== undefined) updateFields.minProjectBudget = minProjectBudget;
    if (preferredProjectType !== undefined) updateFields.preferredProjectType = preferredProjectType;
    if (phone !== undefined) updateFields.phone = phone;
    if (isEmailVerified !== undefined) updateFields.isEmailVerified = isEmailVerified;
    if (isPhoneVerified !== undefined) updateFields.isPhoneVerified = isPhoneVerified;
    if (reviews !== undefined) updateFields.reviews = reviews;
    if (stats !== undefined) updateFields.stats = stats;
    if (title !== undefined) updateFields.title = title;
    if (hourlyRate !== undefined) updateFields.hourlyRate = hourlyRate;
    if (links !== undefined) updateFields.links = links;
    if (industry !== undefined) updateFields.industry = industry;
    if (tagline !== undefined) updateFields.tagline = tagline;
    if (companySize !== undefined) updateFields.companySize = companySize;
    if (businessType !== undefined) updateFields.businessType = businessType;
    if (gstNumber !== undefined) updateFields.gstNumber = gstNumber;
    if (isPaymentVerified !== undefined) updateFields.isPaymentVerified = isPaymentVerified;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload user avatar image
 * @route   POST /api/profile/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Update user avatar path
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a review to a freelancer's profile
 * @route   POST /api/profile/:id/review
 * @access  Private (Client only)
 */
const addReview = async (req, res, next) => {
  try {
    const { rating, reviewText, projectName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const freelancer = await User.findById(req.params.id);
    if (!freelancer || freelancer.role !== 'freelancer') {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    // Prevent self-review
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }

    const newReview = {
      clientName: req.user.name,
      rating: Number(rating),
      reviewText: reviewText || '',
      projectName: projectName || '',
      createdAt: new Date(),
    };

    freelancer.reviews = freelancer.reviews || [];
    freelancer.reviews.push(newReview);
    await freelancer.save();

    res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, uploadAvatar, addReview };
