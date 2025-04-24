import { create } from 'zustand'
import * as SecureStoreUtils from '@/utils/secureStore'
import { loginUser, signupUser, getUserProfile, UserCredentials, User } from '@/services/api' // Assuming api service exports these
import { router } from 'expo-router' // Import router

interface AuthState {
  token: string | null
  user: User | null // Use the User type from api service
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
        set({ token: storedToken, isAuthenticated: true, user: null });
        try {
          console.log('initializeAuth: Token found, fetching user profile...');
          // Call getUserProfile immediately using the stored token
          const userProfile = await getUserProfile(storedToken);
          set({ user: userProfile }); // Update user state
          console.log('initializeAuth: User profile fetched successfully.');
        } catch (fetchError: any) {
          console.error('initializeAuth: Failed to fetch user profile with stored token:', fetchError);
          // Handle potentially invalid token (e.g., log out)
          if (fetchError?.response?.status === 401) {
            console.warn('initializeAuth: Token invalid, logging out.');
            await SecureStoreUtils.deleteToken();
            set({ token: null, user: null, isAuthenticated: false, error: 'Invalid session' });
          } else {
            // Keep authenticated but signal profile load failure?
            set({ error: 'Failed to load profile' });
            // Consider if we should logout even for non-401 errors if profile is essential
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
    const token = get().token;
    if (!token) {
      console.log('fetchAndUpdateUser: No token found, skipping update.');
      return; // No token, cannot fetch profile
    }
    try {
      console.log('fetchAndUpdateUser: Fetching latest user profile...');
      const updatedUser = await getUserProfile(token);
      set({ user: updatedUser });
      console.log('fetchAndUpdateUser: User state updated successfully.');
    } catch (error: any) {
      console.error('fetchAndUpdateUser: Failed to fetch/update user profile:', error);
      // Optional: Handle specific errors, e.g., clear auth if token is invalid (401 Unauthorized)
      if (error?.response?.status === 401) {
        console.warn('fetchAndUpdateUser: Token might be invalid, clearing auth state.');
        get().logout(); // Call logout if token is invalid
      }
      // Keep existing error state or set a new one? Depends on desired behavior.
      // set({ error: 'Failed to update user profile' });
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
      console.error('Login failed:', error)
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
      const { token, user } = await signupUser(credentials)
      // Automatically log in the user after successful signup
      await SecureStoreUtils.saveToken(token)
      set({ token, user, isAuthenticated: true, isLoading: false, error: null })

      // === REMOVED Navigation Logic ===
      // Navigation is now handled in _layout.tsx based on auth state and user wallets
      // ================================
    } catch (error: any) {
      console.error('Signup failed:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed'
      // Ensure state is reset correctly on failure
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
      // Don't save token on signup failure
      await SecureStoreUtils.deleteToken()
      // Re-throw error to be caught by the component
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      // TODO: Call backend logout endpoint if necessary
      await SecureStoreUtils.deleteToken()
      set({ token: null, user: null, isAuthenticated: false, error: null })
    } catch (error) {
      console.error('Logout failed:', error)
      set({ error: 'Logout failed' })
    } finally {
      set({ isLoading: false })
    }
  }
}))

// Initialize auth state when the store is created/imported
// Note: This runs when the app loads. Ensure this is the desired behavior.
// Consider calling initializeAuth explicitly in your root layout component instead.
// useAuthStore.getState().initializeAuth();
