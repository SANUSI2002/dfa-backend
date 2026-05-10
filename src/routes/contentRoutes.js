import express from 'express';
import requireAuth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadMedia,
  getGallery,
  addVideo,
  getVideos,
} from '../controllers/contentController.js';

const router = express.Router();

/**
 * Content management routes (Media & Videos)
 * Requires authentication
 */

// Apply authentication to all routes
router.use(requireAuth);

/**
 * Media/Gallery routes
 */

// Upload media file
router.post('/media', upload.single('file'), uploadMedia);

// Get media gallery
router.get('/media', getGallery);

/**
 * Video routes
 */

// Add video to library
router.post('/videos', addVideo);

// Get videos
router.get('/videos', getVideos);

export default router;
