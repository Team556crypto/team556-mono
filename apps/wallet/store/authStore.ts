import { create } from 'zustand'
import { saveToken, getToken, deleteToken } from '@/utils/secureStore'
import { loginUser, signupUser, getUserProfile, UserCredentials, User } from '@/services/api' // Assuming api service exports these
import { useFirearmStore } from './firearmStore' // Import firearmStore

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
  isP1PresaleUser: () => boolean // New selector
  canAddItem: () => boolean // New selector
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
    console.log('[AuthStore] initializeAuth: Starting...')
    set({ isLoading: true, error: null })
    try {
      const storedToken = await getToken()
      console.log(
        '[AuthStore] initializeAuth: Stored token retrieved:',
        storedToken ? `Token found (length: ${storedToken.length})` : 'No token found'
      )

      if (storedToken) {
        set(state => {
          console.log(
            '[AuthStore] initializeAuth: Token found. Current state BEFORE setting token/auth:',
            JSON.stringify(state)
          )
          return { token: storedToken, isAuthenticated: true }
        })
        console.log('[AuthStore] initializeAuth: State AFTER setting token/auth:', JSON.stringify(get()))

        try {
          console.log('[AuthStore] initializeAuth: Attempting to fetch user profile with token:', storedToken)
          const userProfile = await getUserProfile(storedToken)
          console.log('[AuthStore] initializeAuth: User profile fetched successfully:', JSON.stringify(userProfile))

          set(state => {
            console.log('[AuthStore] initializeAuth: Current state BEFORE setting user profile:', JSON.stringify(state))
            return { user: userProfile, error: null }
          })
          console.log('[AuthStore] initializeAuth: State AFTER setting user profile:', JSON.stringify(get()))
        } catch (profileError: any) {
          console.error('[AuthStore] initializeAuth: Failed to fetch profile:', JSON.stringify(profileError))
          const status = profileError?.response?.status
          // A 401, 403 (permissions) or 404 (user for this token not found) from /user/profile indicates the token is effectively invalid for this action.
          if (status === 401 || status === 403 || status === 404) {
            console.log(`[AuthStore] initializeAuth: Profile fetch failed with status ${status}. Logging out.`)
            await deleteToken()
            set({ user: null, token: null, isAuthenticated: false, error: 'Session invalid or expired. Please login.' })
          } else {
            console.log(
              '[AuthStore] initializeAuth: Profile fetch failed with other error (e.g., network issue). Keeping auth state for now.'
            )
            set({ error: 'Could not update user profile. Functionality may be limited.' })
          }
          console.log('[AuthStore] initializeAuth: State AFTER profile fetch error:', JSON.stringify(get()))
        }
      } else {
        console.log('[AuthStore] initializeAuth: No token in SecureStore. Setting unauthenticated state.')
        set({ user: null, token: null, isAuthenticated: false, error: null })
        console.log('[AuthStore] initializeAuth: State AFTER no token found:', JSON.stringify(get()))
      }
    } catch (e) {
      console.error('[AuthStore] initializeAuth: Critical error (e.g., storage issue):', JSON.stringify(e))
      set({ user: null, token: null, isAuthenticated: false, error: 'Initialization failed' })
      console.log('[AuthStore] initializeAuth: State AFTER critical error:', JSON.stringify(get()))
    } finally {
      set({ isLoading: false })
      console.log('[AuthStore] initializeAuth: Finished. isLoading: false. Final state:', JSON.stringify(get()))
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
      await saveToken(token)
      set({ token, user, isAuthenticated: true, isLoading: false, error: null })

      // === REMOVED Navigation Logic ===
      // Navigation is now handled in _layout.tsx based on auth state and user wallets
      // ================================
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
      await deleteToken() // Clear any potentially invalid token
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
        await deleteToken()
        throw new Error('Signup failed: Invalid response from server.')
      }

      // Automatically log in the user after successful signup
      await saveToken(token)

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
          await deleteToken()
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
      await deleteToken()
      set({ token: null, user: null, isAuthenticated: false, error: null })
    } catch (error) {
      // Catches errors from SecureStore or potential API call
      set({ error: 'Logout failed' })
    } finally {
      set({ isLoading: false })
    }
  },

  isP1PresaleUser: () => {
    const user = get().user;
    return !!user && user.presale_type === 1;
  },

  canAddItem: () => {
    if (get().isP1PresaleUser()) {
      return true; // P1 users can always add items
    }
    // For non-P1 users, check the firearm count from firearmStore
    const firearmCount = useFirearmStore.getState().firearms.length;
    return firearmCount < 2;
  }
}))

// Initialize auth state when the store is created/imported
// Note: This runs when the app loads. Ensure this is the desired behavior.
// Consider calling initializeAuth explicitly in your root layout component instead.
