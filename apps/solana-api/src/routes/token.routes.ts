import { Router } from 'express';
import { airdropTokens } from '../controllers/token.controller';

const router: Router = Router();

// POST /api/token/airdrop
router.post('/airdrop', airdropTokens);

export default router;
