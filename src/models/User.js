import mongoose from 'mongoose';

/**
 * User schema for MongoDB
 * Links Firebase UID with user profile and role information
 */
const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'organizer'],
        message: 'Role must be one of: user, admin, organizer',
      },
      default: 'user',
    },
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

// Update updatedAt before save
userSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

const User = mongoose.model('User', userSchema);

export default User;
