import mongoose from 'mongoose';

/**
 * Media schema for gallery and media library
 * Stores uploaded images/files from Cloudinary
 */
const mediaSchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      trim: true,
      enum: {
        values: ['Event', 'Banner', 'Gallery', 'Testimonial', 'Other'],
        message:
          'Category must be one of: Event, Banner, Gallery, Testimonial, Other',
      },
    },
    visibleOnSite: {
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
 * Index for efficient gallery queries
 */
mediaSchema.index({ visibleOnSite: 1, createdAt: -1 });
mediaSchema.index({ category: 1 });

const Media = mongoose.model('Media', mediaSchema);

export default Media;
