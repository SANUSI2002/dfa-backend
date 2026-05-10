/**
 * Custom AppError class for consistent error handling
 * Extends native Error with HTTP status code and isOperational flag
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Mark as operational error (known and expected)
    this.isOperational = true;

    // Capture stack trace and exclude AppError constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
