// Type for Wallet data from API
export interface Wallet {
  id: number
  user_id: number
  address: string // Public key
  name: string
  created_at: string
  updated_at: string
}

// Type for user data expected from the API (adjust based on your actual User model)
export interface User {
  id: number
  email: string
  first_name?: string
  last_name?: string
  email_verified: boolean // Correct field name from backend
  has_redeemed_presale: boolean // Field indicating if user redeemed a presale code
  wallets?: Wallet[] // Add wallets array (optional because preload might fail)
  redeem_wallet?: Wallet
  presale_type?: number | null // Added optional presale_type
  // Add other fields as needed
}

// Type for login credentials
export interface UserCredentials {
  email: string
  password: string
}

// Type for the successful login response
export interface LoginResponse {
  token: string
  user: User
}

// Type for create wallet request (now requires password)
export interface CreateWalletRequest {
  password: string
}

// Type for create wallet response
export interface CreateWalletResponse {
  message: string
  mnemonic: string
}

// Type for API error responses
export interface ApiErrorResponse {
  error: string
}

// Type for email verification request body
export interface VerifyEmailRequest {
  verification_code: string // Match the backend Go struct tag
}

// Type for email verification success response
export interface VerifyEmailResponse {
  message: string
}

// Type for resend verification email success response
export interface ResendVerificationResponse {
  message: string
}

// Type for check presale code response
export interface CheckPresaleCodeResponse {
  isValid: boolean
  redeemed: boolean
  type?: number // Present if isValid is true
  message: string
}

// Type for redeem presale code request
export interface RedeemPresaleCodeRequest {
  code: string
  walletAddress?: string
}

// Type for redeem presale code response
export interface RedeemPresaleCodeResponse {
  success: boolean
  message: string
}

// Type for sign transaction request
export interface SignTransactionRequest {
  password: string
  unsignedTransaction: string // base64 encoded unsigned transaction
}

// Type for sign transaction response
export interface SignTransactionResponse {
  signedTransaction: string // base64 encoded signed transaction
}

// --- Get Recovery Phrase ---
export interface GetRecoveryPhraseRequest {
  password: string
}

export interface GetRecoveryPhraseResponse {
  recoveryPhrase?: string
  error?: string // Include error field for potential API errors
}

// --- SWAP TYPES ---

// Copied basic type from SwapDrawerContent - consider a shared location
export interface QuoteResponseV6 {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee: any // Adjust type as needed
  priceImpactPct: string
  routePlan: any[] // Adjust type as needed
  contextSlot: number
  timeTaken: number
}

export interface GetQuoteRequest {
  inputMint: string
  outputMint: string
  amount: number // Change type to number
  slippageBps: number
}

export interface GetQuoteResponse {
  quoteResponse: QuoteResponseV6
}

export interface ExecuteSwapRequest {
  password: string
  quoteResponse: QuoteResponseV6
  publicKey?: string // Add optional public key for token account creation
}

// Type for create token account transaction response
export interface CreateTokenAccountsResponse {
  status: 'needs_token_accounts'
  createAccountTransaction: string // Base64 encoded unsigned transaction
  missingAccounts: { mint: string; address: string }[]
  message: string
}

// Type for submit token account transaction request
export interface SubmitTokenAccountsRequest {
  signedTransaction: string // Base64 encoded signed transaction
  password: string
}

// Type for submit token account transaction response
export interface SubmitTokenAccountsResponse {
  status: 'success'
  signature: string
  message: string
}

// Type for execute swap response with status field
export interface ExecuteSwapResponseWithStatus {
  status: 'success' | 'needs_token_accounts'
  signature?: string
  createAccountTransaction?: string
  missingAccounts?: { mint: string; address: string }[]
  message?: string
}

// Add other shared types here as needed
