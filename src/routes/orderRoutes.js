import express from 'express';
import { createOrder, flutterwaveWebhook } from '../controllers/orderController.js';

const router = express.Router();

/**
 * Order routes
 * All routes are public (no authentication required for guest checkout)
 */

// Create order (checkout)
router.post('/checkout', createOrder);

// Flutterwave webhook for payment confirmation
router.post('/webhook/flutterwave', flutterwaveWebhook);

export default router;
