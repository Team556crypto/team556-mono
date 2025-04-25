import { Router } from 'express'
import { createWallet, getBalance, getTeamTokenBalance } from './../controllers/wallet.controller'

const router = Router()

// Define routes relative to the '/wallet' mount point in routes/index.ts
router.post('/create', createWallet)
// GET /wallet/balance/:address - Fetches SOL balance for a given public key
router.get('/balance/:address', getBalance)
router.get('/balance/team/:address', getTeamTokenBalance) // For TEAM Token

export default router
