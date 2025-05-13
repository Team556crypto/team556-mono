import './_global-env'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import routes from './routes'
import paymentRoutes from './routes/paymentRoutes'

// Load environment variables from root
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const app = express()
// Explicitly parse the port to a number
const port = parseInt(process.env.SOLANA_API__PORT || '4000', 10)
const isProduction = process.env.SOLANA_API__NODE_ENV === 'production'

// Middleware
app.use(helmet())

// Configure CORS based on environment
if (isProduction) {
  const allowedOrigin = process.env.SOLANA_API__REQUEST_ORIGIN
  if (!allowedOrigin) {
    console.warn('WARNING: SOLANA_API__REQUEST_ORIGIN environment variable not set in production mode')
  }

  app.use(
    cors({
      origin: allowedOrigin || false, // Fallback to no origins if not specified
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    })
  )
} else {
  // In development, accept any origin
  app.use(cors())
}

app.use(express.json())

// --- Debugging Middleware: Log all incoming requests ---
app.use((req, res, next) => {
  next() // Pass control to the next middleware/router
})
// ----------------------------------------------------

// Routes
app.use('/api', routes)
app.use('/api/v1', paymentRoutes)

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'healthy' })
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Solana API server running at http://0.0.0.0:${port}`)
  console.log(
    `🔒 CORS: ${isProduction ? 'Production mode - restricted origins' : 'Development mode - all origins allowed'}`
  )
})
