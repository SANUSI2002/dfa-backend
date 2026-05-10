import express from 'express';
import verifyFirebaseToken from '../middleware/auth.js';
import { getMyProfile } from '../controllers/userController.js';

const router = express.Router();

/**
 * User routes
 * All routes require Firebase authentication
 */

// Get authenticated user's profile
router.get('/me', verifyFirebaseToken, getMyProfile);

export default router;
