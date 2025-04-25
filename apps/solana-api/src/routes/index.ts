import { Router, Request, Response } from 'express'
import walletRoutes from './walletRoutes'

const router = Router()

// Base route
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Solana API is running!',
    version: '0.1.0'
  })
})

// Wallet routes - Mount the new router
router.use('/wallet', walletRoutes)

export default router
