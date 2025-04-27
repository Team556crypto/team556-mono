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
interface LoginResponse {
  token: string
  user: User
}

// Type for create wallet request (now requires password)
interface CreateWalletRequest {
  password: string
}

// Type for create wallet response
interface CreateWalletResponse {
  message: string
  mnemonic: string
}

// Type for API error responses
interface ApiErrorResponse {
  error: string
}

// Type for email verification request body
interface VerifyEmailRequest {
  verification_code: string // Match the backend Go struct tag
}

// Type for email verification success response
interface VerifyEmailResponse {
  message: string
}

// Type for resend verification email success response
interface ResendVerificationResponse {
  message: string
}

// Type for check presale code response
interface CheckPresaleCodeResponse {
  isValid: boolean
  redeemed: boolean
  type?: number // Present if isValid is true
  message: string
}

// Type for redeem presale code request
interface RedeemPresaleCodeRequest {
  code: string
  walletAddress?: string
}

// Type for redeem presale code response
interface RedeemPresaleCodeResponse {
  success: boolean
  message: string
}

// Type for sign transaction request
interface SignTransactionRequest {
  password: string
  unsignedTransaction: string // base64 encoded unsigned transaction
}

// Type for sign transaction response
interface SignTransactionResponse {
  signedTransaction: string // base64 encoded signed transaction
}

/**
 * Makes a POST request to the login endpoint.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves with the login response (token and user).
 * @throws An error if the login fails or the request is unsuccessful.
 */
export async function loginUser(credentials: UserCredentials): Promise<LoginResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  const data = await response.json()

  if (!response.ok) {
    // Attempt to parse the error message from the API response
    const errorData = data as ApiErrorResponse
    const errorMessage = errorData?.error || `Login failed with status: ${response.status}`
    console.error('Login API Error:', errorMessage, 'Status:', response.status)
    // Create a structured error object
    const error = new Error(errorMessage) as any // Use 'any' to add custom properties
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as LoginResponse
}

/**
 * Makes a POST request to the signup endpoint.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves with the signup response (token and user).
 * @throws An error if the signup fails or the request is unsuccessful.
 */
export async function signupUser(credentials: UserCredentials): Promise<LoginResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  // Change target endpoint from /signup to /register
  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  const data = await response.json()

  if (!response.ok) {
    // Attempt to parse the error message from the API response
    const errorData = data as ApiErrorResponse
    const errorMessage = errorData?.error || `Signup failed with status: ${response.status}`
    console.error('Signup API Error:', errorMessage, 'Status:', response.status)
    // Create a structured error object
    const error = new Error(errorMessage) as any // Use 'any' to add custom properties
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as LoginResponse
}

/**
 * Makes a POST request to the logout endpoint.
 * @param token - The authentication token.
 * @returns A promise that resolves if logout is successful on the server.
 * @throws An error if the logout fails or the request is unsuccessful.
 */
export async function logoutUser(token: string | null): Promise<void> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  if (!token) {
    console.warn('Logout attempted without an authentication token. Skipping server call.')
    return
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // Include the token
      }
      // No body needed for this specific logout endpoint
    })

    // Even if the request fails, we might still want to clear client-side state.
    // But let's check the response first.

    if (!response.ok) {
      // Try to parse the error, but don't let server errors block client logout
      try {
        const data = await response.json()
        const errorData = data as ApiErrorResponse
        const errorMessage = errorData?.error || `Logout failed with status: ${response.status}`
        console.error('Logout API Error:', errorMessage, 'Status:', response.status)
        // Throw an error to indicate the server logout failed,
        // but the calling function should still proceed with client-side logout.
        const error = new Error(errorMessage) as any
        error.response = {
          data: errorData,
          status: response.status
        }
        throw error
      } catch (parseError) {
        // Handle cases where the response is not valid JSON or body is empty
        console.error('Logout API Error: Could not parse error response. Status:', response.status)
        throw new Error(`Logout failed with status: ${response.status}`)
      }
    } else {
      // Optionally read success message if needed
      await response.json()
    }
  } catch (networkError) {
    // Re-throw the error so the UI can potentially inform the user,
    // but the calling function should still proceed with client-side logout.
    throw networkError
  }
}

/**
 * Makes a POST request to the create wallet endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param password - The user's password for wallet creation.
 * @returns A promise that resolves with the create wallet response (message and mnemonic).
 * @throws An error if the request fails.
 */
export async function createWallet(
  token: string | null,
  password: string
): Promise<CreateWalletResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  if (!token) {
    throw new Error('Authentication token is required to create a wallet.')
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/wallet/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` // Include the token
    },
    body: JSON.stringify({ password } as CreateWalletRequest)
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ApiErrorResponse
    const errorMessage = errorData?.error || `Create wallet failed with status: ${response.status}`
    console.error('Create Wallet API Error:', errorMessage, 'Status:', response.status)
    const error = new Error(errorMessage) as any
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as CreateWalletResponse
}

/**
 * Fetches the current authenticated user's profile.
 * @param token - The authentication token.
 * @returns A promise that resolves with the user's profile data.
 * @throws An error if the request fails or the user is not authenticated.
 */
export async function getUserProfile(token: string | null): Promise<User> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  if (!token) {
    throw new Error('Authentication token is required to fetch user profile.')
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) // Catch potential JSON parse errors
    // Create a structured error object including the status code
    const error = new Error(
      errorData?.error || `Failed to fetch user profile: ${response.statusText}`
    ) as any // Use 'any' to add custom properties
    error.response = {
      data: errorData,
      status: response.status // Include status code
    }
    throw error
  }

  const user: User = await response.json()
  return user
}

/**
 * Makes a POST request to the email verification endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param code - The 6-digit verification code.
 * @returns A promise that resolves with the success message.
 * @throws An error if the request fails or verification is unsuccessful.
 */
export async function verifyEmail(token: string | null, code: string): Promise<VerifyEmailResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }
  if (!token) {
    throw new Error('Authentication token is required for email verification.')
  }
  if (!code || code.length !== 6) {
    throw new Error('A valid 6-digit verification code is required.')
  }

  const body: VerifyEmailRequest = { verification_code: code }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ApiErrorResponse
    const errorMessage = errorData?.error || `Email verification failed with status: ${response.status}`
    console.error('Email Verification API Error:', errorMessage, 'Status:', response.status)
    const error = new Error(errorMessage) as any
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as VerifyEmailResponse
}

/**
 * Makes a POST request to resend the verification email.
 * Requires authentication.
 * @param token - The authentication token.
 * @returns A promise that resolves with the success message.
 * @throws An error if the request fails.
 */
export async function resendVerificationEmail(token: string | null): Promise<ResendVerificationResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }
  if (!token) {
    throw new Error('Authentication token is required to resend verification email.')
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Keep content-type even without body
      Authorization: `Bearer ${token}`
    }
    // No body needed for this request
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ApiErrorResponse // Assume error structure is consistent
    const errorMessage = errorData?.error || `Resend verification email failed with status: ${response.status}`
    console.error('Resend Verification API Error:', errorMessage, 'Status:', response.status)
    const error = new Error(errorMessage) as any
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as ResendVerificationResponse
}

// ==========================
// Presale Code API Calls
// ==========================

/**
 * Checks the validity and status of a presale code.
 */
export const checkPresaleCode = async (code: string, token: string | null): Promise<CheckPresaleCodeResponse> => {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  if (!token) {
    // Return an error or throw if the token is missing, as it's required for this endpoint
    // This check might be redundant if the calling code ensures the token exists
    return { isValid: false, redeemed: false, message: 'Authentication token is missing.' }
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/wallet/check-presale-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // Add the Authorization header
      },
      body: JSON.stringify({ code })
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as ApiErrorResponse
      const errorMessage = errorData?.error || `Check presale code failed with status: ${response.status}`
      console.error('Check Presale Code API Error:', errorMessage, 'Status:', response.status)
      const error = new Error(errorMessage) as any
      error.response = {
        data: errorData,
        status: response.status
      }
      throw error
    }

    return data as CheckPresaleCodeResponse
  } catch (error: any) {
    console.error('Error checking presale code:', error.response?.data || error.message)
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to check code'
    return { isValid: false, redeemed: false, message: errorMessage }
  }
}

/**
 * Redeems a presale code.
 */
export const redeemPresaleCode = async (
  data: RedeemPresaleCodeRequest,
  token: string | null
): Promise<RedeemPresaleCodeResponse> => {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }

  if (!token) {
    // Return an error or throw if the token is missing
    return { success: false, message: 'Authentication token is missing.' }
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/api/wallet/redeem-presale-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // Add the Authorization header
      },
      body: JSON.stringify(data)
    })

    const responseData = await response.json()

    if (!response.ok) {
      const errorData = responseData as ApiErrorResponse
      const errorMessage = errorData?.error || `Redeem presale code failed: ${response.status}`
      console.error('Redeem Presale Code API Error:', errorMessage, 'Status:', response.status)
      const error = new Error(errorMessage) as any
      error.response = { data: errorData, status: response.status }
      throw error
    }

    return responseData as RedeemPresaleCodeResponse
  } catch (error: any) {
    console.error('Error redeeming presale code:', error.response?.data || error.message)
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to redeem code'
    return { success: false, message: errorMessage }
  }
}

// ==========================
// Transaction Signing
// ==========================

/**
 * Makes a POST request to the sign transaction endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param password - The user's password for mnemonic decryption.
 * @param unsignedTransaction - The base64 encoded unsigned Solana transaction.
 * @returns A promise that resolves with the base64 encoded signed transaction.
 * @throws An error if the request fails.
 */
export async function signTransaction(
  token: string | null,
  password: string,
  unsignedTransaction: string
): Promise<SignTransactionResponse> {
  if (!process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL) {
    throw new Error('API URL is not configured.')
  }
  if (!token) {
    throw new Error('Authentication required.')
  }
  if (!password || !unsignedTransaction) {
    throw new Error('Password and unsigned transaction are required.')
  }

  const requestBody: SignTransactionRequest = {
    password,
    unsignedTransaction
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/wallet/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ApiErrorResponse
    // Customize error message based on status if needed (e.g., 401 for bad password)
    let errorMessage = errorData?.error
    if (!errorMessage) {
      errorMessage = `Signing failed with status: ${response.status}`
    }
    if (response.status === 401) {
      errorMessage = 'Signing failed. Please check your password.' // More user-friendly for 401
    }

    console.error('Sign Transaction API Error:', errorMessage, 'Status:', response.status)
    const error = new Error(errorMessage) as any
    error.response = { data: errorData, status: response.status }
    throw error
  }

  return data as SignTransactionResponse
}
