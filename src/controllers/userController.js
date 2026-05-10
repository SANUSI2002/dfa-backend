import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';

/**
 * Get the authenticated user's profile
 * Prevents Broken Object Level Authorization (BOLA) by strictly using req.user.uid
 */
const getMyProfile = catchAsync(async (req, res, next) => {
  // Extract firebaseUid from authenticated request (BOLA prevention)
  const { uid } = req.user;

  // Fetch user using Firebase UID only (no query parameters allowed)
  const user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    logger.warn(`User profile not found for Firebase UID: ${uid}`);
    return next(new AppError('User profile not found', 404));
  }

  logger.info(`User profile retrieved: ${uid}`);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

export { getMyProfile };
