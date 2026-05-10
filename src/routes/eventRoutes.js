import express from 'express';

import {
  getAllEvents,
  getEvent,
  createEvent,
  deleteEvent,
  addTicketTier
} from '../controllers/eventController.js';

import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * Event routes
 */

// Get all events + Create event
router
  .route('/')
  .get(getAllEvents)
  .post(
    upload.single('bannerImage'),
    createEvent
  );

// Get single event + Delete event
router
  .route('/:id')
  .get(getEvent)
  .delete(deleteEvent);

/**
 * Add ticket tier to event
 */
router.post(
  '/:eventId/tickets',
  addTicketTier
);

export default router;