import { Router } from 'express';
import { createPaymentRequest } from '../controllers/paymentController';
import { internalAuthMiddleware } from '../middleware/internalAuth';

const router = Router();

// Define the route for creating a payment request
// Apply internal authentication middleware first
router.post('/pay', internalAuthMiddleware, createPaymentRequest);

export default router;
