import Media from '../models/Media.js';
import Video from '../models/Video.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';

/**
 * Upload media file to gallery
 * Stores Cloudinary URL in Media document
 */
const uploadMedia = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const { title, category, visibleOnSite } = req.body;

  // Create media document
  const media = await Media.create({
    fileUrl: req.file.path, // Cloudinary URL
    title: title?.trim(),
    category,
    visibleOnSite: visibleOnSite === true || visibleOnSite === 'true',
  });

  logger.info(`Media uploaded successfully: ${media._id}`, {
    fileUrl: media.fileUrl,
    category: media.category,
  });

  res.status(201).json({
    status: 'success',
    message: 'Media uploaded successfully',
    data: {
      media,
    },
  });
});

/**
 * Get all media from gallery
 * Returns media sorted by creation date (newest first)
 */
const getGallery = catchAsync(async (req, res, next) => {
  const { category, visibleOnly } = req.query;

  // Build filter
  const filter = {};
  if (category) {
    filter.category = category;
  }
  if (visibleOnly === 'true') {
    filter.visibleOnSite = true;
  }

  const media = await Media.find(filter)
    .sort({ createdAt: -1 })
    .select('-__v');

  logger.info(`Retrieved ${media.length} media items from gallery`);

  res.status(200).json({
    status: 'success',
    results: media.length,
    data: {
      media,
    },
  });
});

/**
 * Add video to library
 * Stores YouTube video information
 */
const addVideo = catchAsync(async (req, res, next) => {
  const { title, category, youtubeUrl, isPublished } = req.body;

  // Validate required fields
  if (!title || !youtubeUrl) {
    return next(
      new AppError('Missing required fields: title, youtubeUrl', 400)
    );
  }

  // Create video document
  const video = await Video.create({
    title: title.trim(),
    category,
    youtubeUrl,
    isPublished: isPublished === true || isPublished === 'true',
  });

  logger.info(`Video added successfully: ${video._id}`, {
    title: video.title,
    category: video.category,
  });

  res.status(201).json({
    status: 'success',
    message: 'Video added successfully',
    data: {
      video,
    },
  });
});

/**
 * Get all videos from library
 * Returns videos sorted by creation date (newest first)
 */
const getVideos = catchAsync(async (req, res, next) => {
  const { category, publishedOnly } = req.query;

  // Build filter
  const filter = {};
  if (category) {
    filter.category = category;
  }
  if (publishedOnly === 'true') {
    filter.isPublished = true;
  }

  const videos = await Video.find(filter)
    .sort({ createdAt: -1 })
    .select('-__v');

  logger.info(`Retrieved ${videos.length} videos from library`);

  res.status(200).json({
    status: 'success',
    results: videos.length,
    data: {
      videos,
    },
  });
});

export { uploadMedia, getGallery, addVideo, getVideos };
