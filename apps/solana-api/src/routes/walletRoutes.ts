import { Router } from 'express'
import { 
  createWallet, 
  getBalance, 
  getTeamTokenBalance, 
  signTransaction,
  sendTransaction 
} from './../controllers/wallet.controller'

const router: Router = Router()

// Define routes relative to the '/wallet' mount point in routes/index.ts
router.post('/create', createWallet)
// GET /wallet/balance/:address - Fetches SOL balance for a given public key
router.get('/balance/:address', getBalance)
router.get('/balance/team/:address', getTeamTokenBalance) // For TEAM Token
// POST /wallet/sign - Receives mnemonic and unsigned transaction, returns signed transaction
router.post('/sign', signTransaction)
// POST /wallet/send - Receives signed transaction, sends to blockchain and waits for confirmation
router.post('/send', sendTransaction)

export default router
