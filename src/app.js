import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import authRoutes from './routes/authRoutes.js';
import attendeeRoutes from './routes/attendeeRoutes.js';

import errorHandler from './middleware/errorHandler.js';

import logger from './config/logger.js';

const app = express();

/**
 * Security Middleware
 */

// Helmet
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500',

      // Vercel
      'https://dfa-site-l49g.vercel.app',
      'https://dash-rosy-five.vercel.app',

      // Custom Domains
      'https://dfaummah.com',
      'https://www.dfaummah.com',
      'https://dashboard.dfaummah.com'
    ],

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],
  })
);

// Rate Limiting
const limiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 100,

  message:
    'Too many requests from this IP, please try again later.',

  standardHeaders: true,

  legacyHeaders: false,

});

app.use(limiter);

/**
 * Body Parsers
 */
app.use(
  express.json({
    limit: '10kb'
  })
);

app.use(
  express.urlencoded({
    limit: '10kb',
    extended: true
  })
);

/**
 * Request Logging
 */
app.use((req, res, next) => {

  logger.info(
    `${req.method} ${req.path}`
  );

  next();

});

/**
 * Routes
 */
app.use('/api/users', userRoutes);

app.use('/api/v1/events', eventRoutes);

app.use('/api/v1/orders', orderRoutes);

app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/content', contentRoutes);

app.use('/api/v1/staff', staffRoutes);

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/attendees', attendeeRoutes);

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {

  res.status(200).json({

    status: 'success',

    message: 'API is running',

    timestamp: new Date().toISOString(),

  });

});

/**
 * 404
 */
app.use((req, res, next) => {

  res.status(404).json({

    status: 'error',

    message: `Route ${req.path} not found`,

  });

});

/**
 * Global Error Handler
 */
app.use(errorHandler);

export default app;