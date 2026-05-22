import express from "express";
import {
  createAttendee,
  getAttendees,
  checkInAttendee,
  deleteAttendee,
} from "../controllers/attendeeController.js";

const router = express.Router();

/**
 * Create attendee (walk-in cash payment)
 * POST /api/v1/attendees
 */
router.post("/", createAttendee);

/**
 * Get all attendees
 * GET /api/v1/attendees
 */
router.get("/", getAttendees);

/**
 * Check in attendee by ticketId (QR scan or manual)
 * POST /api/v1/attendees/checkin
 */
router.post("/checkin", checkInAttendee);

/**
 * Delete attendee by ID
 * DELETE /api/v1/attendees/:id
 */
router.delete("/:id", deleteAttendee);

export default router;
