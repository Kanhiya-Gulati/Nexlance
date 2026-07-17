const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Represents both clients and freelancers
 * on the NEXLANCE platform
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['client', 'freelancer'],
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    skills: [{ type: String }],
    experience: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    links: {
      website: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    industry: { type: String, default: '' },
    tagline: { type: String, default: '' },
    companySize: { type: String, default: '' },
    businessType: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    isPaymentVerified: { type: Boolean, default: true },
    portfolioLinks: [{ type: String }],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        cost: { type: Number, default: 0 },
        link: { type: String, default: '' },
      },
    ],
    location: {
      type: String,
      default: '',
    },
    languages: [{ type: String, default: ['English'] }],
    education: [
      {
        school: { type: String, default: '' },
        degree: { type: String, default: '' },
        year: { type: Number, default: 2024 },
      },
    ],
    certifications: [
      {
        name: { type: String, default: '' },
        issuer: { type: String, default: '' },
        year: { type: Number, default: 2024 },
      },
    ],
    availability: {
      type: String,
      enum: ['Available', 'Busy'],
      default: 'Available',
    },
    minProjectBudget: {
      type: Number,
      default: 0,
    },
    preferredProjectType: {
      type: String,
      enum: ['Fixed Price', 'Hourly', 'Both'],
      default: 'Both',
    },
    phone: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpire: {
      type: Date,
      default: null,
    },
    reviews: [
      {
        clientName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        reviewText: { type: String, default: '' },
        projectName: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    stats: {
      responseTime: { type: String, default: '1 hour' },
      successRate: { type: Number, default: 100 },
      repeatClients: { type: Number, default: 0 },
    },
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook - Hash password before saving
 * Only hashes if the password field has been modified
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method - Compare entered password with hashed password
 * @param {string} enteredPassword - The password to verify
 * @returns {boolean} True if passwords match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
