import express from 'express';
import requireAuth from '../middleware/auth.js';
import restrictTo from '../middleware/rbac.js';
import upload from '../middleware/upload.js';
import {
  createEvent,
  getDashboardStats,
  getTransactions,
  manualAddAttendee,
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * Admin routes
 * All routes require authentication and admin/organizer role
 */

// Apply authentication and RBAC to all routes
router.use(requireAuth);
// The new, correct roles
router.use(restrictTo('Super Admin', 'Operations Manager', 'Content Manager'));
/**
 * Create event with banner image upload
 * POST /api/v1/admin/events
 */
router.post(
  '/events', 
  restrictTo('Super Admin', 'Operations Manager', 'Content Manager'), 
  upload.single('bannerImage'), 
  createEvent
);
/**
 * Get dashboard statistics
 * GET /api/v1/admin/stats
 */
router.get('/stats', getDashboardStats);

/**
 * Get all transactions with optional status filter
 * GET /api/v1/admin/transactions?status=Successful
 */
router.get('/transactions', getTransactions);

/**
 * Manually add attendee without payment
 * POST /api/v1/admin/attendees/manual
 */
router.post('/attendees/manual', manualAddAttendee);

export default router;
