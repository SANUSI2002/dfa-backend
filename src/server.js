import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import logger from './config/logger.js';

// Load environment variables
dotenv.config();

console.log(
  "CLOUDINARY KEY:",
  process.env.CLOUDINARY_API_KEY
);

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'CLIENT_URL',
  'PORT',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

requiredEnvVars.forEach((envVar) => {

  if (!process.env[envVar]) {

    logger.error(
      `Missing required environment variable: ${envVar}`
    );

    process.exit(1);

  }

});

const PORT = process.env.PORT || 5000;

/**
 * Initialize and start the server
 */
const startServer = async () => {

  try {

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    logger.info(
      'Connected to MongoDB successfully'
    );

    // Start Express server
    app.listen(PORT, () => {

      logger.info(
        `Server is running on port ${PORT}`
      );

      logger.info(
        `Environment: ${process.env.NODE_ENV || 'development'}`
      );

    });

  } catch (error) {

    logger.error(
      'Failed to start server:',
      error
    );

    process.exit(1);

  }

};

// Handle unhandled promise rejections
process.on(
  'unhandledRejection',
  (reason, promise) => {

    logger.error(
      'Unhandled Rejection at:',
      promise,
      'reason:',
      reason
    );

  }
);

// Handle uncaught exceptions
process.on(
  'uncaughtException',
  (error) => {

    logger.error(
      'Uncaught Exception:',
      error
    );

    process.exit(1);

  }
);

// Start the server
startServer();