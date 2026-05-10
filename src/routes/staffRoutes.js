import express from 'express';
import requireAuth from '../middleware/auth.js';
import restrictTo from '../middleware/rbac.js';
import {
  addStaff,
  getAllStaff,
  updateStaffPermissions,
} from '../controllers/staffController.js';

const router = express.Router();

/**
 * Staff management routes
 * Requires authentication and Super Admin role
 */

router.use(requireAuth);

// The new, correct roles
router.use(restrictTo('Super Admin', 'Operations Manager', 'Content Manager'));
/**
 * Add new staff member
 * POST /api/v1/staff
 */
router.post('/', addStaff);

/**
 * Get all staff members
 * GET /api/v1/staff
 */
router.get('/', getAllStaff);

/**
 * Update staff member permissions and role
 * PATCH /api/v1/staff/:id/permissions
 */
router.patch('/:id/permissions', updateStaffPermissions);

export default router;
