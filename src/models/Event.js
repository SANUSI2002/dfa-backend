import mongoose from 'mongoose';

/**
 * Ticket tier subdocument schema
 * Defines pricing tiers for each event with enhanced features
 */
const ticketTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tier name is required'],
      enum: ['Standard', 'VIP', 'Premium', 'Early Bird'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Ticket capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative'],
    },
    currency: {
      type: String,
      default: 'NGN',
      trim: true,
    },
    perksBenefits: [
      {
        type: String,
        trim: true,
      },
    ],
    enableDiscounts: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Sold Out', 'Hidden'],
        message: 'Status must be Available, Sold Out, or Hidden',
      },
      default: 'Available',
    },
  },
  { _id: true }
);

/**
 * Event schema for ticketing system
 * Stores comprehensive event details for dashboard and public display
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subTitle: {
      type: String,
      trim: true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: function (value) {
          return value >= new Date();
        },
        message: 'Event date cannot be in the past',
      },
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      match: [/^\d{2}:\d{2}$/, 'Please provide time in HH:mm format'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    capacity: {
      type: Number,
      min: [1, 'Event capacity must be at least 1'],
    },
    registrationDeadline: {
      type: Date,
    },
    bannerImage: {
      type: String, // URL from Cloudinary
    },
    videoPreviewUrl: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['Upcoming', 'Past', 'Draft'],
        message: 'Status must be Upcoming, Past, or Draft',
      },
      default: 'Draft',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    ticketTiers: [ticketTierSchema],
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
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
 * Index for efficient querying
 */
eventSchema.index({ isPublished: 1, status: 1 });
eventSchema.index({ createdAt: -1 });

/**
 * Validator to ensure at least one ticket tier is present
 */
eventSchema.pre('save', function () {
  if (!this.ticketTiers || this.ticketTiers.length === 0) {
    throw new Error('At least one ticket tier is required');
  }
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
