import Media from '../models/Media.js';
import Video from '../models/Video.js';
import WebContent from '../models/WebContent.js';
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

  const media = await Media.create({
    fileUrl: req.file.path,
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
    data: { media },
  });
});

/**
 * Get all media from gallery
 */
const getGallery = catchAsync(async (req, res, next) => {
  const { category, visibleOnly } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (visibleOnly === 'true') filter.visibleOnSite = true;

  const media = await Media.find(filter).sort({ createdAt: -1 }).select('-__v');

  logger.info(`Retrieved ${media.length} media items from gallery`);

  res.status(200).json({
    status: 'success',
    results: media.length,
    data: { media },
  });
});

/**
 * Add video to library
 */
const addVideo = catchAsync(async (req, res, next) => {
  const { title, category, youtubeUrl, isPublished } = req.body;

  if (!title || !youtubeUrl) {
    return next(new AppError('Missing required fields: title, youtubeUrl', 400));
  }

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
    data: { video },
  });
});

/**
 * Get all videos from library
 */
const getVideos = catchAsync(async (req, res, next) => {
  const { category, publishedOnly } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (publishedOnly === 'true') filter.isPublished = true;

  const videos = await Video.find(filter).sort({ createdAt: -1 }).select('-__v');

  logger.info(`Retrieved ${videos.length} videos from library`);

  res.status(200).json({
    status: 'success',
    results: videos.length,
    data: { videos },
  });
});

/**
 * Get website content
 * GET /api/v1/web-content
 */
const getWebContent = catchAsync(async (req, res) => {
  let content = await WebContent.findOne({ key: 'main' });

  if (!content) {
    content = await WebContent.create({ key: 'main' });
    logger.info('Created default web content document');
  }

  logger.info('Web content retrieved');

  res.status(200).json({
    status: 'success',
    data: { content },
  });
});

/**
 * Save website content
 * PUT /api/v1/web-content
 */
const saveWebContent = catchAsync(async (req, res) => {
  const { hero, about, whatWeDo, content, footer } = req.body;

  const updated = await WebContent.findOneAndUpdate(
    { key: 'main' },
    { hero, about, whatWeDo, content, footer },
    { new: true, upsert: true, runValidators: false }
  );

  logger.info('Web content saved successfully');

  res.status(200).json({
    status: 'success',
    message: 'Content saved successfully',
    data: { content: updated },
  });
});

export { uploadMedia, getGallery, addVideo, getVideos, getWebContent, saveWebContent };
