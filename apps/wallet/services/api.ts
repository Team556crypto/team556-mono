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
  first_name?: string // Make optional if not always present
  last_name?: string // Make optional if not always present
  emailVerified: boolean // Add email verification status
  wallets?: Wallet[] // Add wallets array (optional because preload might fail)
  redeem_wallet?: Wallet
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
      const data = await response.json()
      console.log('Server logout successful:', data.message || 'OK')
    }
  } catch (networkError) {
    console.error('Logout network error:', networkError)
    // Re-throw the error so the UI can potentially inform the user,
    // but the calling function should still proceed with client-side logout.
    throw networkError
  }
}

/**
 * Makes a POST request to the create wallet endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @returns A promise that resolves with the create wallet response (message and mnemonic).
 * @throws An error if the request fails.
 */
export async function createWallet(token: string | null): Promise<CreateWalletResponse> {
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
      Authorization: `Bearer ${token}`
    }
    // No body needed for this endpoint
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
    throw new Error(errorData?.error || `Failed to fetch user profile: ${response.statusText}`)
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

  const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ verification_code: code } as VerifyEmailRequest)
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ApiErrorResponse
    const errorMessage = errorData?.error || `Email verification failed with status: ${response.status}`
    console.error('Verify Email API Error:', errorMessage, 'Status:', response.status)
    const error = new Error(errorMessage) as any
    error.response = {
      data: errorData,
      status: response.status
    }
    throw error
  }

  return data as VerifyEmailResponse
}

// Add other API functions here as needed (e.g., getUserProfile, etc.)
