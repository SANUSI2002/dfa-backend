import AppError from './AppError.js';
import logger from '../config/logger.js';

/**
 * Initialize Flutterwave payment
 * Creates a payment link for the order checkout
 * @param {Object} payload - Payment initialization data
 * @param {String} payload.orderRef - Unique order reference (tx_ref)
 * @param {Number} payload.amount - Payment amount in NGN
 * @param {String} payload.email - Customer email
 * @param {String} payload.name - Customer full name
 * @param {String} payload.phone - Customer phone number
 * @returns {Promise<String>} - Flutterwave checkout URL
 */
const initializePayment = async ({ orderRef, amount, email, name, phone }) => {
  try {
    // Validate required parameters
    if (!orderRef || !amount || !email || !name || !phone) {
      throw new Error('Missing required payment parameters');
    }

    // Flutterwave API endpoint
    const flutterwaveUrl = 'https://api.flutterwave.com/v3/payments';

    // Prepare request payload
    const payload = {
      tx_ref: orderRef,
      amount,
      currency: 'NGN',
      redirect_url: process.env.CLIENT_URL,
      customer: {
        email,
        phonenumber: phone,
        name,
      },
      customizations: {
        title: 'DFA Event Ticket',
      },
    };

    // Make POST request to Flutterwave using global fetch
    const response = await fetch(flutterwaveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Check if request was successful
    if (!response.ok || data.status !== 'success') {
      logger.error('Flutterwave payment initialization failed:', data);
      throw new AppError(
        data.message || 'Failed to initialize payment with Flutterwave',
        400
      );
    }

    logger.info(`Payment initialized for order: ${orderRef}`, {
      amount,
      checkoutUrl: data.data.link,
    });

    // Return the checkout URL
    return data.data.link;
  } catch (error) {
    logger.error(`Flutterwave initialization error: ${error.message}`);
    throw error;
  }
};

export { initializePayment };
