import { create } from 'zustand'
import { saveToken, getToken, deleteToken } from '@/utils/secureStore'
import { loginUser, signupUser, getUserProfile, deleteAccount as deleteAccountAPI, UserCredentials, User } from '@/services/api' // Assuming api service exports these
import { useFirearmStore } from './firearmStore'
import { useGearStore } from './gearStore'
import { useDocumentStore } from './documentStore'
import { useAmmoStore } from './ammoStore'
import { useNFAStore } from './nfaStore'
import { router } from 'expo-router'; // Added for navigation

interface AuthState {
  token: string | null
  user: User | null // Use the User type from api service
  password: string | null // To hold password during signup -> wallet creation
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  initializeAuth: () => Promise<void>
  login: (credentials: UserCredentials) => Promise<void>
  signup: (credentials: UserCredentials) => Promise<void>
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchAndUpdateUser: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  isP1PresaleUser: () => boolean // New selector
  canAddItem: (itemType: 'firearm' | 'gear' | 'document' | 'ammo' | 'nfa') => boolean // New selector
  clearPassword: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  password: null,
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
          // Any failure to fetch profile with a stored token means the session is likely invalid.
          console.log(`[AuthStore] initializeAuth: Profile fetch failed. Logging out.`)
          get().logout(); // This will clear state and redirect
          set({ error: 'Session invalid or expired. Please login.' }); // Error message for login page
          console.log('[AuthStore] initializeAuth: State AFTER profile fetch error and logout:', JSON.stringify(get()))
        }
      } else {
        console.log('[AuthStore] initializeAuth: No token in SecureStore. Setting unauthenticated state.')
        // If no token, ensure state is clean. UI should redirect based on isAuthenticated: false.
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
      console.log('[AuthStore] fetchAndUpdateUser: No token found. Logging out.');
      get().logout(); // If no token, logout and redirect
      return
    }
    try {
      console.log('[AuthStore] fetchAndUpdateUser: Attempting to fetch user profile with token:', token);
      const updatedUser = await getUserProfile(token)
      console.log('[AuthStore] fetchAndUpdateUser: User profile updated successfully:', JSON.stringify(updatedUser));
      set({ user: updatedUser, error: null })
    } catch (error: any) {
      console.error('[AuthStore] fetchAndUpdateUser: Failed to update profile:', JSON.stringify(error));
      // Any failure to update user profile when a token exists should lead to logout.
      get().logout();
      set({ error: 'Failed to update user profile. Please login again.' });
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
      // Handle detailed error messages, especially for account deletion
      const errorData = error.response?.data
      let errorMessage = error.response?.data?.error || error.message || 'Login failed'
      
      // If there's a detailed message (like for account deletion), include it
      if (errorData?.message) {
        errorMessage = `${errorMessage}: ${errorData.message}`
      }
      
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
      await deleteToken() // Clear any potentially invalid token
      // Re-throw the error if you want calling components to handle it further
      // throw error;
    }
  },

  signup: async ({ email, password }) => {
    set({ isLoading: true, error: null })
    try {
      const responseData = await signupUser({ email, password })
      const { token, user } = responseData

      if (!token || !user) {
        throw new Error('Signup failed: Invalid response from server.')
      }

      await saveToken(token)

      // Store password temporarily for wallet creation
      set({ token, user, password, isAuthenticated: true, isLoading: false, error: null })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed'
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
      await deleteToken()
      throw error
    }
  },

  clearPassword: () => set({ password: null }),

  logout: async () => {
    set({ isLoading: true })
    try {
      // TODO: Call backend logout endpoint if necessary
      // Example if logoutUser API needed calling: await logoutUser(get().token);
      await deleteToken()
      set({ token: null, user: null, isAuthenticated: false, error: null, isLoading: false })
      router.replace('/'); // Redirect to landing/login page
    } catch (error) {
      // Catches errors from SecureStore or potential API call
      console.error('[AuthStore] logout: Failed to logout:', error);
      set({ error: 'Logout failed', isLoading: false })
      // Still attempt to redirect even if part of logout failed
      router.replace('/');
    } 
  },

  deleteAccount: async (password: string) => {
    set({ isLoading: true, error: null })
    try {
      const token = get().token
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Call the API to delete the account
      await deleteAccountAPI(password, token)
      
      // Clear all user data and logout
      await deleteToken()
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false, 
        error: null, 
        isLoading: false 
      })
      
      // Redirect to login page
      router.replace('/signin')
    } catch (error: any) {
      console.error('[AuthStore] deleteAccount: Failed to delete account:', error)
      set({ 
        error: error.message || 'Failed to delete account', 
        isLoading: false 
      })
      throw error // Re-throw so the UI can handle it
    }
  },

  isP1PresaleUser: () => {
    const user = get().user;
    return !!user && user.presale_type === 1;
  },

    canAddItem: (itemType: 'firearm' | 'gear' | 'document' | 'ammo' | 'nfa') => {
    if (get().isP1PresaleUser()) {
      return true; // P1 users can always add items
    }

    // For non-P1 users, check the count from the relevant store
    switch (itemType) {
      case 'firearm':
        return useFirearmStore.getState().firearms.length < 2;
      case 'gear':
        return useGearStore.getState().gear.length < 2;
      case 'document':
        return useDocumentStore.getState().documents.length < 2;
      case 'ammo':
        return useAmmoStore.getState().ammos.length < 2;
      case 'nfa':
        return useNFAStore.getState().nfaItems.length < 2;
      default:
        return false;
    }
  }
}))

// Initialize auth state when the store is created/imported
// Note: This runs when the app loads. Ensure this is the desired behavior.
// Consider calling initializeAuth explicitly in your root layout component instead.
