import { Router, Request, Response } from 'express'
import walletRoutes from './walletRoutes'
import swapRoutes from './swap.routes'
import tokenRoutes from './token.routes'

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

// Swap routes
router.use('/swap', swapRoutes)

// Token routes
router.use('/token', tokenRoutes)

export default router
