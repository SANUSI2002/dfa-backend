// src/middleware/upload.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';
import logger from '../config/logger.js';

/**
 * Configure Cloudinary storage
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dfa_events',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  },
});

/**
 * File filter
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Invalid file type uploaded: ${file.mimetype}`);
    cb(
      Object.assign(new Error('Invalid file type. Only JPG and PNG images are allowed.'), {
        statusCode: 400,
      }),
      false
    );
  }
};

/**
 * Multer instance
 */
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Wraps a multer middleware and forwards errors properly to Express errorHandler
 * @param {Function} uploadFn - e.g. multerUpload.single('image')
 */
const wrapMulter = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    // Multer-specific errors
    if (err.name === 'MulterError') {
      const error = new Error(
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 5MB.'
          : err.message
      );
      error.statusCode = 400;
      logger.warn(`Multer error: ${err.code} - ${err.message}`);
      return next(error);
    }

    // File filter errors or any other errors
    err.statusCode = err.statusCode || 400;
    logger.warn(`Upload error: ${err.message}`);
    return next(err);
  });
};

/**
 * Ready-to-use upload middlewares
 *
 * Usage in routes:
 *   router.post('/event', upload.single('image'), controller)
 *   router.post('/gallery', upload.array('images', 5), controller)
 *   router.post('/mixed', upload.fields([{ name: 'cover', maxCount: 1 }]), controller)
 */
const upload = {
  single: (fieldName) => wrapMulter(multerUpload.single(fieldName)),
  array: (fieldName, maxCount) => wrapMulter(multerUpload.array(fieldName, maxCount)),
  fields: (fieldsArray) => wrapMulter(multerUpload.fields(fieldsArray)),
  none: () => wrapMulter(multerUpload.none()),
};

export default upload;