import { Request, Response } from 'express'

export const getWalletBalance = (req: Request, res: Response) => {
  const { address } = req.params

  // This is a placeholder - in a real implementation,
  // you would connect to Solana blockchain here
  res.json({
    address,
    balance: '10.5 SOL',
    usdValue: '$315.00',
    timestamp: new Date().toISOString()
  })
}

export const getWalletTransactions = (req: Request, res: Response) => {
  const { address } = req.params
  const { limit = 10, offset = 0 } = req.query

  // Mock data for demonstration
  const transactions = Array.from({ length: Number(limit) }, (_, i) => ({
    id: `tx_${i + Number(offset)}`,
    type: Math.random() > 0.5 ? 'send' : 'receive',
    amount: (Math.random() * 2).toFixed(2),
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    status: 'confirmed'
  }))

  res.json({
    address,
    transactions,
    pagination: {
      total: 100,
      limit: Number(limit),
      offset: Number(offset)
    }
  })
}
