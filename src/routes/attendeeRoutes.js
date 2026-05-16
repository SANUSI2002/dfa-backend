import express from "express";

import {
  createAttendee,
  getAttendees,
  checkInAttendee
} from "../controllers/attendeeController.js";

const router = express.Router();

/**
 * Create attendee
 */
router.post(
  "/",
  createAttendee
);

/**
 * Get attendees
 */
router.get(
  "/",
  getAttendees
);

/**
 * Check in attendee
 */
router.post(
  "/checkin",
  checkInAttendee
);

export default router;
