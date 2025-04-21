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

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' })
})

// Wallet routes
router.get('/wallet/balance/:address', walletController.getWalletBalance)
router.get('/wallet/transactions/:address', walletController.getWalletTransactions)

export default router
