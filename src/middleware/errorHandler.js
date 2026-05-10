import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  // ✅ Normalize: wrap strings into proper Error objects
  if (typeof err === 'string') {
    err = new Error(err);
  }

  // ✅ Normalize: handle plain objects thrown as errors
  if (!(err instanceof Error) && typeof err === 'object') {
    const msg = err.message || 'Internal Server Error';
    const status = err.statusCode || err.status || 500;
    err = Object.assign(new Error(msg), { statusCode: status });
  }

  // Default error properties
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error
  logger.error(`${err.statusCode} - ${err.message}`, {
    error: err,
    path: req.path,
    method: req.method,
  });

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    err.message = `Invalid ${err.path}: ${err.value}`;
    err.statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    err.message = `${field} already exists`;
    err.statusCode = 409;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    err.statusCode = 400;
    err.message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5MB.'
        : err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token';
    err.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Token has expired';
    err.statusCode = 401;
  }

  res.status(err.statusCode).json({
    status: 'error',
    statusCode: err.statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;