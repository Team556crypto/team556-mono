import { Router, Request, Response } from 'express'
import * as walletController from '../controllers/wallet.controller'

const router = Router()

// Base route
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Solana API is running!',
    version: '0.1.0'
  })
})

// Wallet routes
router.post('/wallet/create', walletController.createWallet)

export default router
