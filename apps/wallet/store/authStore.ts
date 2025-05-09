import { create } from 'zustand'
import * as SecureStoreUtils from '@/utils/secureStore'
import { loginUser, signupUser, getUserProfile, UserCredentials, User } from '@/services/api' // Assuming api service exports these

interface AuthState {
  token: string | null
  user: User | null // Use the User type from api service
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  initializeAuth: () => Promise<void>
  login: (credentials: UserCredentials) => Promise<void>
  signup: (credentials: UserCredentials) => Promise<void> // Revert signature
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchAndUpdateUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading until initialization is done
  error: null,

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  initializeAuth: async () => {
    set({ isLoading: true })
    try {
      const storedToken = await SecureStoreUtils.getToken()
      if (storedToken) {
        // TODO: Optionally validate token with backend here
        // For now, assume stored token is valid
        // Set token/auth status first, assume valid until profile fetch fails
        set({ token: storedToken, isAuthenticated: true, user: null })
        try {
          // Call getUserProfile immediately using the stored token
          const userProfile = await getUserProfile(storedToken)
          set({ user: userProfile }) // Update user state
        } catch (profileError: any) {
          console.error('Failed to fetch profile during init:', profileError)
          // If token is invalid (401) or user not found (404), logout
          if (profileError?.response?.status === 401 || profileError?.response?.status === 404) {
            get().logout()
            // After logout, reset necessary state again for clarity
            set({ token: null, isAuthenticated: false, user: null, error: null })
          } else {
            // Keep authenticated but signal profile load failure?
            set({ error: 'Failed to load profile' })
            // Consider if we should logout even for non-401/404 errors if profile is essential
          }
        }
      } else {
        // No token found
        set({ token: null, isAuthenticated: false, user: null })
      }
    } catch (e) {
      console.error('Failed to initialize auth:', e)
      set({ token: null, isAuthenticated: false, user: null, isLoading: false, error: 'Initialization failed' })
    } finally {
      // Ensure loading is set to false regardless of outcome
      set({ isLoading: false })
    }
  },

  fetchAndUpdateUser: async () => {
    const token = get().token
    if (!token) {
      return // No token, cannot fetch profile
    }
    try {
      const updatedUser = await getUserProfile(token)
      set({ user: updatedUser })
    } catch (error: any) {
      // Handle specific errors: logout if token is invalid (401) or user not found (404)
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        get().logout() // Call logout if token is invalid or user not found
      } else {
        // Keep existing error state or set a new one? Depends on desired behavior.
        set({ error: 'Failed to update user profile' })
      }
    }
  },

  login: async credentials => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await loginUser(credentials) // Call API service
      await SecureStoreUtils.saveToken(token)
      set({ token, user, isAuthenticated: true, isLoading: false, error: null })

      // === REMOVED Navigation Logic ===
      // Navigation is now handled in _layout.tsx based on auth state and user wallets
      // ================================
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
      await SecureStoreUtils.deleteToken() // Clear any potentially invalid token
      // Re-throw the error if you want calling components to handle it further
      // throw error;
    }
  },

  signup: async credentials => {
    set({ isLoading: true, error: null })
    try {
      // Call the signupUser function from the API service
      const responseData = await signupUser(credentials)

      // Now destructure
      const { token, user } = responseData

      // Check if token or user are undefined/null before proceeding
      if (!token || !user) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Signup failed: Invalid response from server.'
        })
        await SecureStoreUtils.deleteToken()
        throw new Error('Signup failed: Invalid response from server.')
      }

      // Automatically log in the user after successful signup
      await SecureStoreUtils.saveToken(token)

      set({ token, user, isAuthenticated: true, isLoading: false, error: null })

      // === REMOVED Navigation Logic ===
      // Navigation is now handled in _layout.tsx based on auth state and user wallets
      // ================================
    } catch (error: any) {
      // Check if the error was already handled by the token/user check above
      if (!get().error) {
        // Check for specific 409 Conflict error
        if (error.response?.status === 409) {
          set({ error: 'Email already registered. Please sign in.', isLoading: false })
        } else {
          // Handle other errors
          const errorMessage = error.response?.data?.error || error.message || 'Signup failed'
          set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
          await SecureStoreUtils.deleteToken()
        }
      }
      // Re-throw error to be caught by the component
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      // TODO: Call backend logout endpoint if necessary
      // Example if logoutUser API needed calling: await logoutUser(get().token);
      await SecureStoreUtils.deleteToken()
      set({ token: null, user: null, isAuthenticated: false, error: null })
    } catch (error) {
      // Catches errors from SecureStore or potential API call
      set({ error: 'Logout failed' })
    } finally {
      set({ isLoading: false })
    }
  }
}))

// Initialize auth state when the store is created/imported
// Note: This runs when the app loads. Ensure this is the desired behavior.
// Consider calling initializeAuth explicitly in your root layout component instead.
