import crypto from 'crypto';
import Event from '../models/Event.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';
import { initializePayment } from '../utils/flutterwave.js';

import Attendee from '../models/Attendee.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

/**
 * Create an order during checkout
 * Validates ticket availability and creates order with pending payment status
 */
const createOrder = catchAsync(async (req, res, next) => {

  const {
    eventId,
    buyerDetails,
    ticketType,
    quantity,
    attendees,
    paymentMethod
  } = req.body;

  // Validate required fields
  if (
    !eventId ||
    !buyerDetails ||
    !ticketType ||
    !quantity ||
    !paymentMethod
  ) {

    return next(
      new AppError(
        'Missing required fields for checkout',
        400
      )
    );

  }

  // Validate buyer details
  if (
    !buyerDetails.name ||
    !buyerDetails.whatsapp ||
    !buyerDetails.email
  ) {

    return next(
      new AppError(
        'Incomplete buyer details provided',
        400
      )
    );

  }

  // Fetch event
  const event =
    await Event.findById(eventId);

  if (!event) {

    logger.warn(
      `Checkout attempted for non-existent event: ${eventId}`
    );

    return next(
      new AppError(
        'Event not found',
        404
      )
    );

  }

  // Find ticket tier
  const tier =
    event.ticketTiers.find(
      (t) => t.name === ticketType
    );

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

  // Check availability
  const availableTickets =
    tier.capacity - tier.sold;

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

  // Validate quantity
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {

    return next(
      new AppError(
        'Quantity must be a positive integer',
        400
      )
    );

  }

  // Calculate amount
  const totalAmount =
    tier.price * quantity;

  // Generate reference
  const reference =
    `ORD-${Date.now()}-${crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;

  // Create order
  const order =
    await Order.create({

      event: eventId,

      buyerDetails: {

        name:
          buyerDetails.name.trim(),

        whatsapp:
          buyerDetails.whatsapp.trim(),

        email:
          buyerDetails.email
            .trim()
            .toLowerCase(),

      },

      ticketType,

      quantity,

      attendees:
        attendees || [],

      payment: {

        totalAmount,

        method:
          paymentMethod,

        status: 'Pending',

        reference,

      },

    });

  // Initialize Flutterwave
  const checkoutUrl =
    await initializePayment({

      orderRef:
        reference,

      amount:
        totalAmount,

      email:
        buyerDetails.email
          .trim()
          .toLowerCase(),

      name:
        buyerDetails.name.trim(),

      phone:
        buyerDetails.whatsapp.trim(),

    });

  logger.info(
    `Order created and payment initialized: ${reference}`,
    {
      orderId: order._id,
      eventId,
      quantity,
    }
  );

  res.status(201).json({

    status: 'success',

    message:
      'Order created. Proceed to payment.',

    data: {

      order,

      paymentReference:
        reference,

      totalAmount,

      checkoutUrl,

    },

  });

});

/**
 * Flutterwave Webhook
 */
const flutterwaveWebhook = catchAsync(async (req, res, next) => {

  // Extract signature
  const signature =
    req.headers['verif-hash'];

  // Validate signature
  if (
    signature !==
    process.env.FLW_SECRET_HASH
  ) {

    logger.warn(
      'Webhook signature verification failed'
    );

    return next(
      new AppError(
        'Invalid webhook signature',
        401
      )
    );

  }

  // Extract payload
  const { event, data } =
    req.body;

  // Check payment success
  if (
    event === 'charge.completed' &&
    data.status === 'successful'
  ) {

    try {

      // Find order
      const order =
        await Order.findOne({
          'payment.reference':
            data.tx_ref,
        });

      if (!order) {

        logger.warn(
          `Order not found for reference: ${data.tx_ref}`
        );

        return res.status(200).end();

      }

      /**
       * Prevent duplicate webhook processing
       */
      if (
        order.payment.status ===
        'Successful'
      ) {

        return res.status(200).end();

      }

      // Update payment status
      order.payment.status =
        'Successful';

      await order.save();

      logger.info(
        `Payment successful for order: ${data.tx_ref}`
      );

      /**
       * Find event
       */
      const eventData =
        await Event.findById(
          order.event
        );

      if (!eventData) {

        logger.error(
          `Event not found for order: ${order._id}`
        );

        return res.status(200).end();

      }

      /**
       * Update sold tickets
       */
      const tier =
        eventData.ticketTiers.find(
          (t) =>
            t.name ===
            order.ticketType
        );

      if (tier) {

        tier.sold +=
          order.quantity;

        await eventData.save();

        logger.info(
          `Ticket tier updated: ${order.ticketType}, sold: ${tier.sold}`
        );

      }

      /**
       * Email transporter
       */
      const transporter =
        nodemailer.createTransport({

          service: 'gmail',

          auth: {

            user:
              process.env.EMAIL_USER,

            pass:
              process.env.EMAIL_PASS,

          },

        });

      /**
       * Create attendees
       */
      for (
        let i = 0;
        i < order.quantity;
        i++
      ) {

        // Ticket ID
        const ticketId =
          'DFA-' +
          uuidv4()
            .slice(0, 8)
            .toUpperCase();

        // QR data
        const qrData =
          JSON.stringify({

            ticketId,

            email:
              order.buyerDetails.email,

          });

        // QR image
        const qrCode =
          await QRCode.toDataURL(
            qrData
          );

        // Save attendee
        const attendee =
          await Attendee.create({

            name:
              order.buyerDetails.name,

            email:
              order.buyerDetails.email,

            phone:
              order.buyerDetails.whatsapp,

            eventId:
              order.event,

            eventTitle:
              eventData.title,

            ticketType:
              order.ticketType,

            amountPaid:
              order.payment.totalAmount,

            paymentStatus:
              'Paid',

            checkedIn: false,

            ticketId,

            qrCode,

          });

        /**
         * Send email
         */
        await transporter.sendMail({

          from:
            process.env.EMAIL_USER,

          to:
            attendee.email,

          subject:
            'Your DFA Event Ticket 🎟️',

          html: `
            <div style="font-family:sans-serif;padding:20px;">

              <h2>
                Thank you for purchasing your ticket 🎉
              </h2>

              <p>
                Your payment was successful.
              </p>

              <p>
                Event:
                <strong>
                  ${eventData.title}
                </strong>
              </p>

              <p>
                Ticket Type:
                <strong>
                  ${attendee.ticketType}
                </strong>
              </p>

              <p>
                Ticket ID:
                <strong>
                  ${attendee.ticketId}
                </strong>
              </p>

              <p>
                Present this QR code at the venue entrance.
              </p>

              <img
                src="${qrCode}"
                width="250"
              />

              <p>
                This QR code serves as your official gate pass.
              </p>

            </div>
          `

        });

      }

      logger.info(
        `Attendees created and tickets emailed for order: ${data.tx_ref}`
      );

    } catch (error) {

      logger.error(
        `Webhook processing error: ${error.message}`
      );

    }

  }

  // Acknowledge webhook
  res.status(200).end();

});

export {
  createOrder,
  flutterwaveWebhook
};