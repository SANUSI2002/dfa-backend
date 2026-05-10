import mongoose from 'mongoose';

/**
 * Video schema for YouTube links and video library
 * Stores YouTube video information for display on site
 */
const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      trim: true,
      enum: {
        values: ['Event Highlight', 'Tutorial', 'Testimonial', 'Promo', 'Other'],
        message:
          'Category must be one of: Event Highlight, Tutorial, Testimonial, Promo, Other',
      },
      default: 'Other',
    },
    youtubeUrl: {
      type: String,
      required: [true, 'YouTube URL is required'],
      match: [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11}/,
        'Please provide a valid YouTube URL',
      ],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for efficient video queries
 */
videoSchema.index({ isPublished: 1, createdAt: -1 });
videoSchema.index({ category: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
