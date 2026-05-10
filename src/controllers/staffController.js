import Admin from '../models/Admin.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';

/**
 * Add new staff member
 * Creates Admin document with hashed password
 */
const addStaff = catchAsync(async (req, res, next) => {
  const { name, email, password, role, permissions } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return next(
      new AppError(
        'Missing required fields: name, email, password, role',
        400
      )
    );
  }

  // Check if staff member already exists
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

  if (existingAdmin) {
    return next(
      new AppError('Staff member with this email already exists', 409)
    );
  }

  // Create staff member
  const admin = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    permissions: permissions || {},
  });

  logger.info(`New staff member added: ${admin._id}`, {
    email: admin.email,
    role: admin.role,
  });

  res.status(201).json({
    status: 'success',
    message: 'Staff member added successfully',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    },
  });
});

/**
 * Get all staff members
 * Returns staff list without passwords
 */
const getAllStaff = catchAsync(async (req, res, next) => {
  const staff = await Admin.find()
    .select('-password -__v')
    .sort({ createdAt: -1 });

  logger.info(`Retrieved ${staff.length} staff members`);

  res.status(200).json({
    status: 'success',
    results: staff.length,
    data: {
      staff,
    },
  });
});

/**
 * Update staff permissions and role
 * Allows Super Admin to modify permissions for specific staff
 */
const updateStaffPermissions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, permissions } = req.body;

  // Validate input
  if (!role && !permissions) {
    return next(
      new AppError(
        'At least role or permissions must be provided to update',
        400
      )
    );
  }

  // Find staff member
  const admin = await Admin.findById(id);

  if (!admin) {
    return next(new AppError('Staff member not found', 404));
  }

  // Update role if provided
  if (role) {
    admin.role = role;
  }

  // Update permissions if provided
  if (permissions && typeof permissions === 'object') {
    admin.permissions = {
      ...admin.permissions,
      ...permissions,
    };
  }

  await admin.save();

  logger.info(`Staff permissions updated: ${id}`, {
    role: admin.role,
    permissions: admin.permissions,
  });

  res.status(200).json({
    status: 'success',
    message: 'Staff permissions updated successfully',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    },
  });
});

export { addStaff, getAllStaff, updateStaffPermissions };
