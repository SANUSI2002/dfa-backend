import crypto from 'crypto';
import Event from '../models/Event.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';
import { initializePayment } from '../utils/flutterwave.js';

/**
 * Create an order during checkout
 * Validates ticket availability and creates order with pending payment status
 */
const createOrder = catchAsync(async (req, res, next) => {
  const { eventId, buyerDetails, ticketType, quantity, attendees, paymentMethod } =
    req.body;

  // Validate required fields
  if (!eventId || !buyerDetails || !ticketType || !quantity || !paymentMethod) {
    return next(
      new AppError('Missing required fields for checkout', 400)
    );
  }

  // Validate buyer details
  if (!buyerDetails.name || !buyerDetails.whatsapp || !buyerDetails.email) {
    return next(
      new AppError('Incomplete buyer details provided', 400)
    );
  }

  // Fetch event by ID
  const event = await Event.findById(eventId);

  if (!event) {
    logger.warn(`Checkout attempted for non-existent event: ${eventId}`);
    return next(new AppError('Event not found', 404));
  }

  // Find the matching ticket tier
  const tier = event.ticketTiers.find((t) => t.name === ticketType);

  if (!tier) {
    logger.warn(
      `Invalid ticket tier "${ticketType}" for event: ${eventId}`
    );
    return next(
      new AppError(
        `Ticket tier "${ticketType}" not available for this event`,
        400
      )
    );
  }

  // Check ticket availability
  const availableTickets = tier.capacity - tier.sold;

  if (availableTickets < quantity) {
    logger.warn(
      `Insufficient tickets. Available: ${availableTickets}, Requested: ${quantity}`
    );
    return next(
      new AppError(
        `Not enough tickets available. Only ${availableTickets} tickets remaining.`,
        400
      )
    );
  }

  // Validate quantity is a positive integer
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return next(new AppError('Quantity must be a positive integer', 400));
  }

  // Calculate total amount
  const totalAmount = tier.price * quantity;

  // Generate unique reference (timestamp + random bytes)
  const reference = `ORD-${Date.now()}-${crypto
    .randomBytes(4)
    .toString('hex')
    .toUpperCase()}`;

  // Create order with Pending payment status
  const order = await Order.create({
    event: eventId,
    buyerDetails: {
      name: buyerDetails.name.trim(),
      whatsapp: buyerDetails.whatsapp.trim(),
      email: buyerDetails.email.trim().toLowerCase(),
    },
    ticketType,
    quantity,
    attendees: attendees || [],
    payment: {
      totalAmount,
      method: paymentMethod,
      status: 'Pending',
      reference,
    },
  });

  // Initialize Flutterwave payment
  const checkoutUrl = await initializePayment({
    orderRef: reference,
    amount: totalAmount,
    email: buyerDetails.email.trim().toLowerCase(),
    name: buyerDetails.name.trim(),
    phone: buyerDetails.whatsapp.trim(),
  });

  logger.info(`Order created and payment initialized: ${reference}`, {
    orderId: order._id,
    eventId,
    quantity,
  });

  res.status(201).json({
    status: 'success',
    message: 'Order created. Proceed to payment.',
    data: {
      order,
      paymentReference: reference,
      totalAmount,
      checkoutUrl,
    },
  });
});

/**
 * Handle Flutterwave webhook for payment confirmation
 * Verifies the signature and updates order status on successful payment
 */
const flutterwaveWebhook = catchAsync(async (req, res, next) => {
  // Extract signature from header
  const signature = req.headers['verif-hash'];

  // Validate signature against secret hash
  if (signature !== process.env.FLW_SECRET_HASH) {
    logger.warn('Webhook signature verification failed');
    return next(new AppError('Invalid webhook signature', 401));
  }

  // Extract webhook payload
  const { event, data } = req.body;

  // Check if payment was successful
  if (event === 'charge.completed' && data.status === 'successful') {
    try {
      // Find order by transaction reference
      const order = await Order.findOne({
        'payment.reference': data.tx_ref,
      });

      if (!order) {
        logger.warn(`Order not found for reference: ${data.tx_ref}`);
        return res.status(200).end(); // Still acknowledge webhook
      }

      // Update order payment status
      order.payment.status = 'Successful';
      await order.save();

      logger.info(`Payment successful for order: ${data.tx_ref}`);

      // Find the event and update ticket tier sold count
      const eventData = await Event.findById(order.event);

      if (!eventData) {
        logger.error(`Event not found for order: ${order._id}`);
        return res.status(200).end();
      }

      // Find the matching ticket tier and increment sold count
      const tier = eventData.ticketTiers.find((t) => t.name === order.ticketType);

      if (tier) {
        tier.sold += order.quantity;
        await eventData.save();
        logger.info(
          `Ticket tier updated: ${order.ticketType}, sold: ${tier.sold}`
        );
      } else {
        logger.warn(
          `Ticket tier "${order.ticketType}" not found for event: ${eventData._id}`
        );
      }
    } catch (error) {
      logger.error(`Webhook processing error: ${error.message}`);
    }
  }

  // Always return 200 to acknowledge webhook receipt
  res.status(200).end();
});

export { createOrder, flutterwaveWebhook };
