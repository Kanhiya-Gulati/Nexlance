const mongoose = require('mongoose');

/**
 * Application Schema - Represents a freelancer's application to a job
 */
const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer reference is required'],
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
    },
    proposedBudget: {
      type: Number,
      required: [true, 'Proposed budget is required'],
    },
    estimatedDuration: {
      type: String,
      required: [true, 'Estimated duration is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications - one freelancer per job
applicationSchema.index({ job: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
