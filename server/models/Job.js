const mongoose = require('mongoose');

/**
 * Job Schema - Represents a job posting by a client
 */
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile Development',
        'UI/UX Design',
        'Graphic Design',
        'Content Writing',
        'Digital Marketing',
        'Data Science',
        'Video Editing',
        'SEO',
        'Other',
      ],
    },
    skills: [
      {
        type: String,
        required: [true, 'At least one skill is required'],
      },
    ],
    budgetMin: {
      type: Number,
      required: [true, 'Minimum budget is required'],
    },
    budgetMax: {
      type: Number,
      required: [true, 'Maximum budget is required'],
    },
    duration: {
      type: String,
      required: [true, 'Project duration is required'],
      enum: [
        'Less than 1 week',
        '1-2 weeks',
        '2-4 weeks',
        '1-3 months',
        '3-6 months',
        'More than 6 months',
      ],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'closed'],
      default: 'open',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
jobSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
