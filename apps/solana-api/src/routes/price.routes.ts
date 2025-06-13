import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getTeam556UsdcPrice } from '../controllers/price.controller';

const router = Router();

// Rate limiter: 10 requests per minute per IP
const priceApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a minute.',
});

// GET /api/price/team556-usdc - Unauthenticated, rate-limited endpoint
router.get('/team556-usdc', priceApiLimiter, getTeam556UsdcPrice);

export default router;
