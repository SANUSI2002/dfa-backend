import express from 'express';
import requireAuth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadMedia,
  getGallery,
  addVideo,
  getVideos,
  getWebContent,
  saveWebContent,
} from '../controllers/contentController.js';

const router = express.Router();

/**
 * ── Media / Gallery routes ──────────────────────────────────────────────────
 */

// Upload media file
// POST /api/v1/content/media
router.post('/media', requireAuth, upload.single('file'), uploadMedia);

// Get media gallery
// GET /api/v1/content/media
router.get('/media', getGallery);

/**
 * ── Video routes ────────────────────────────────────────────────────────────
 */

// Add video to library
// POST /api/v1/content/videos
router.post('/videos', requireAuth, addVideo);

// Get videos
// GET /api/v1/content/videos
router.get('/videos', getVideos);

/**
 * ── Website Content routes ──────────────────────────────────────────────────
 */

// Get website content (public — landing page reads from here)
// GET /api/v1/content/web-content
router.get('/web-content', getWebContent);

// Save website content (protected — only admins)
// PUT /api/v1/content/web-content
router.put('/web-content', requireAuth, saveWebContent);

export default router;
