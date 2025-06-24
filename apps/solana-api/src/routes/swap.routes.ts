import express, { Router } from 'express';
import { handleGetQuote, handlePostSwap, handleCreateTokenAccounts } from '../controllers/swap.controller';

const router: Router = express.Router();

// Route to get swap quote
// POST because we send parameters in the request body
router.post('/quote', handleGetQuote);

// Route to get swap transaction
// POST because we send the quote object and user public key in the body
router.post('/swap', handlePostSwap);

// Route to handle token account creation
// POST because we send the signed transaction in the body
router.post('/create-token-accounts', handleCreateTokenAccounts);

export default router;
