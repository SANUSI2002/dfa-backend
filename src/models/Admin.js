import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Permissions schema for granular access control
 */
const permissionsSchema = new mongoose.Schema(
  {
    dashboard: {
      type: Boolean,
      default: true,
    },
    events: {
      type: Boolean,
      default: false,
    },
    tickets: {
      type: Boolean,
      default: false,
    },
    attendees: {
      type: Boolean,
      default: false,
    },
    finance: {
      type: Boolean,
      default: false,
    },
    media: {
      type: Boolean,
      default: false,
    },
    staff: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Admin schema for internal staff authentication and RBAC
 * Stores staff credentials with hashed passwords and role-based permissions
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default
    },
    role: {
      type: String,
      enum: {
        values: [
          'Super Admin',
          'Operations Manager',
          'Customer Support',
          'Content Manager',
          'Finance Manager',
        ],
        message:
          'Role must be one of: Super Admin, Operations Manager, Customer Support, Content Manager, Finance Manager',
      },
      required: [true, 'Role is required'],
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
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

/**
 * Pre-save hook to hash password using bcryptjs
 * Hashes only if password is modified or new
 */
/**
 * Pre-save hook to hash password using bcryptjs
 * Hashes only if password is modified or new
 */
adminSchema.pre('save', async function () {
  // 1. If password is not modified, exit the hook early (no next() needed)
  if (!this.isModified('password')) return;

  // 2. Hash password with cost factor of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare candidate password with stored hashed password
 * @param {String} candidatePassword - Plain text password to compare
 * @param {String} userPassword - Hashed password from database
 * @returns {Boolean} True if passwords match, false otherwise
 */
adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
