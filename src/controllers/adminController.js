import Event from '../models/Event.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

/**
 * Create a new event
 * Handles file upload from multer and stores banner image URL from Cloudinary
 */
const createEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    subTitle,
    date,
    time,
    location,
    description,
    capacity,
    registrationDeadline,
    videoPreviewUrl,
    tags,
    status,
    isPublished,
    ticketTiers,
  } = req.body;

  // Validate required fields
  if (!title || !date || !time || !location || !ticketTiers) {
    return next(
      new AppError(
        'Missing required fields: title, date, time, location, ticketTiers',
        400
      )
    );
  }

  // Parse ticketTiers if it's a string (from form data)
  let parsedTiers = ticketTiers;
  if (typeof ticketTiers === 'string') {
    try {
      parsedTiers = JSON.parse(ticketTiers);
    } catch (error) {
      return next(new AppError('Invalid ticketTiers format', 400));
    }
  }

  // Set banner image from multer upload
  const bannerImage = req.file ? req.file.path : null;

  // Create event object
  const eventData = {
    title: title.trim(),
    subTitle: subTitle?.trim(),
    date,
    time,
    location: location.trim(),
    description: description?.trim(),
    capacity,
    registrationDeadline,
    bannerImage,
    videoPreviewUrl,
    tags: Array.isArray(tags) ? tags : tags?.split(',').map((t) => t.trim()),
    status: status || 'Draft',
    isPublished: isPublished === true || isPublished === 'true',
    ticketTiers: parsedTiers,
  };

  const event = await Event.create(eventData);

  logger.info(`Event created successfully: ${event._id}`, {
    title: event.title,
    bannerImage: event.bannerImage,
  });

  res.status(201).json({
    status: 'success',
    message: 'Event created successfully',
    data: {
      event,
    },
  });
});

/**
 * Get dashboard statistics
 * Returns aggregate counts for overview cards
 */
const getDashboardStats = catchAsync(async (req, res, next) => {
  // Total events
  const totalEvents = await Event.countDocuments();

  // Total ticket orders
  const totalOrders = await Order.countDocuments();

  // Total revenue (sum of successful orders)
  const revenueAgg = await Order.aggregate([
    {
      $match: { 'payment.status': 'Successful' },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$payment.totalAmount' },
      },
    },
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  // Total subscribers (unique buyer emails)
  const totalSubscribers = await Order.distinct('buyerDetails.email');

  logger.info('Dashboard stats retrieved');

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalEvents,
        totalOrders,
        totalRevenue,
        totalSubscribers: totalSubscribers.length,
      },
    },
  });
});

/**
 * Get all transactions with optional status filtering
 * Populates event title for readability
 */
const getTransactions = catchAsync(async (req, res, next) => {
  const { status } = req.query;

  // Build filter query
  const filter = {};
  if (status && ['Pending', 'Successful', 'Failed'].includes(status)) {
    filter['payment.status'] = status;
  }

  // Fetch orders with event details
  const orders = await Order.find(filter)
    .populate('event', 'title')
    .sort({ createdAt: -1 })
    .select('-__v');

  logger.info(`Retrieved ${orders.length} transactions with filter: ${status || 'all'}`);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      transactions: orders,
    },
  });
});

/**
 * Manually add attendee/order by admin
 * Creates order directly without payment gateway, sets status to Successful
 */
const manualAddAttendee = catchAsync(async (req, res, next) => {
  const {
    eventId,
    buyerDetails,
    ticketType,
    quantity,
    attendees,
    specialNote,
  } = req.body;

  // Validate required fields
  if (!eventId || !buyerDetails || !ticketType || !quantity) {
    return next(
      new AppError(
        'Missing required fields: eventId, buyerDetails, ticketType, quantity',
        400
      )
    );
  }

  // Validate buyer details
  if (!buyerDetails.name || !buyerDetails.whatsapp || !buyerDetails.email) {
    return next(
      new AppError('Incomplete buyer details provided', 400)
    );
  }

  // Fetch event
  const event = await Event.findById(eventId);

  if (!event) {
    logger.warn(`Manual attendee: Event not found: ${eventId}`);
    return next(new AppError('Event not found', 404));
  }

  // Find ticket tier
  const tier = event.ticketTiers.find((t) => t.name === ticketType);

  if (!tier) {
    logger.warn(
      `Manual attendee: Invalid ticket tier "${ticketType}" for event: ${eventId}`
    );
    return next(
      new AppError(
        `Ticket tier "${ticketType}" not available for this event`,
        400
      )
    );
  }

  // Check capacity
  const availableTickets = tier.capacity - tier.sold;

  if (availableTickets < quantity) {
    logger.warn(
      `Manual attendee: Insufficient tickets. Available: ${availableTickets}, Requested: ${quantity}`
    );
    return next(
      new AppError(
        `Not enough tickets available. Only ${availableTickets} tickets remaining.`,
        400
      )
    );
  }

  // Generate reference
  const reference = `MAN-${Date.now()}-${crypto
    .randomBytes(4)
    .toString('hex')
    .toUpperCase()}`;

  // Calculate total amount
  const totalAmount = tier.price * quantity;

  // Prepare attendees with special note
  const processedAttendees = (attendees || []).map((a) => ({
    ...a,
    specialNote: a.specialNote || specialNote,
  }));

  // Create order with Successful status
  const order = await Order.create({
    event: eventId,
    buyerDetails: {
      name: buyerDetails.name.trim(),
      whatsapp: buyerDetails.whatsapp.trim(),
      email: buyerDetails.email.trim().toLowerCase(),
    },
    ticketType,
    quantity,
    attendees: processedAttendees,
    payment: {
      totalAmount,
      method: 'Manual',
      status: 'Successful',
      reference,
    },
  });

  // Update ticket tier sold count
  tier.sold += quantity;
  await event.save();

  logger.info(`Manual order created: ${reference}`, {
    orderId: order._id,
    eventId,
    quantity,
  });

  res.status(201).json({
    status: 'success',
    message: 'Attendee added successfully',
    data: {
      order,
      reference,
      totalAmount,
    },
  });
});

export { createEvent, getDashboardStats, getTransactions, manualAddAttendee };
