import { Router } from 'express'
import { 
  createWallet, 
  getBalance, 
  getTeamTokenBalance, 
  signTransaction 
} from './../controllers/wallet.controller'

const router = Router()

// Define routes relative to the '/wallet' mount point in routes/index.ts
router.post('/create', createWallet)
// GET /wallet/balance/:address - Fetches SOL balance for a given public key
router.get('/balance/:address', getBalance)
router.get('/balance/team/:address', getTeamTokenBalance) // For TEAM Token
// POST /wallet/sign - Receives mnemonic and unsigned transaction, returns signed transaction
router.post('/sign', signTransaction)

export default router
