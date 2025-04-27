import express from 'express';
import { handleGetQuote, handlePostSwap } from '../controllers/swap.controller';

const router = express.Router();

// Route to get swap quote
// POST because we send parameters in the request body
router.post('/quote', handleGetQuote);

// Route to get swap transaction
// POST because we send the quote object and user public key in the body
router.post('/swap', handlePostSwap);

export default router;
