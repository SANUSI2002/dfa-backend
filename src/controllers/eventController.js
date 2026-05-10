import Event from '../models/Event.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';

/**
 * Fetch all events
 */
const getAllEvents = catchAsync(async (req, res, next) => {

  const events = await Event.find()
    .select('-__v')
    .sort({ date: 1 });

  logger.info(`Retrieved ${events.length} events`);

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events,
    },
  });

});

/**
 * Fetch single event
 */
const getEvent = catchAsync(async (req, res, next) => {

  const { id } = req.params;

  const event = await Event.findById(id)
    .select('-__v');

  if (!event) {

    logger.warn(`Event not found: ${id}`);

    return next(
      new AppError('Event not found', 404)
    );

  }

  logger.info(`Event retrieved: ${id}`);

  res.status(200).json({
    status: 'success',
    data: {
      event,
    },
  });

});

/**
 * Create event
 */
const createEvent = catchAsync(async (req, res, next) => {

  const data = {
    ...req.body,
    ticketTiers: JSON.parse(req.body.ticketTiers)
  };

  if (req.file) {
    data.bannerImage = req.file.path;
  }

  const event = await Event.create(data);

  logger.info(`New event created: ${event.title}`);

  res.status(201).json({
    status: 'success',
    data: {
      event,
    },
  });

});

/**
 * Delete event
 */
const deleteEvent = catchAsync(async (req, res, next) => {

  const event = await Event.findByIdAndDelete(
    req.params.id
  );

  if (!event) {

    return next(
      new AppError('Event not found', 404)
    );

  }

  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully'
  });

});

/**
 * Add ticket tier to event
 */
const addTicketTier = catchAsync(async (req, res, next) => {

  const { eventId } = req.params;

  const {
    name,
    type,
    price,
    capacity,
    currency,
    status,
    perksBenefits,
    enableDiscounts
} = req.body;

  const event = await Event.findById(eventId);

  if (!event) {

    return next(
      new AppError('Event not found', 404)
    );

  }

  event.ticketTiers.push({

    name,

    type,

    price,

    capacity,

    currency,

    status,

    perksBenefits,

    enableDiscounts

});

  await event.save();

  res.status(201).json({

    status: 'success',

    message: 'Ticket tier added successfully',

    data: {
      event
    }

  });

});

export {
  getAllEvents,
  getEvent,
  createEvent,
  deleteEvent,
  addTicketTier
};