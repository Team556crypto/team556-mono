import { create } from 'zustand'
import { useAuthStore } from './authStore'

// Define the polling interval in milliseconds
const POLLING_INTERVAL_MS = 10000 // 10 seconds

interface BalancePriceResponse {
  balance: number
  price?: number | null
}

interface WalletState {
  solBalance: number | null
  solPrice: number | null
  isSolLoading: boolean
  solError: string | null
  fetchSolBalance: () => Promise<void>

  teamBalance: number | null
  teamPrice: number | null
  isTeamLoading: boolean
  teamError: string | null
  fetchTeamBalance: () => Promise<void>

  // Polling state and controls
  pollingIntervalId: NodeJS.Timeout | null
  startPolling: () => void
  stopPolling: () => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  solBalance: null, // Initialize as null to track first load
  solPrice: null,
  isSolLoading: false,
  solError: null,

  teamBalance: null, // Initialize as null to track first load
  teamPrice: null,
  isTeamLoading: false,
  teamError: null,

  pollingIntervalId: null,

  fetchSolBalance: async () => {
    const token = useAuthStore.getState().token
    const user = useAuthStore.getState().user

    if (!token) {
      // Don't fetch if no token, clear state, ensure polling stops
      set({ solBalance: null, isSolLoading: false, solError: null, solPrice: null })
      get().stopPolling() // Stop polling if token disappears
      return
    }

    // Only set loading if balance hasn't been fetched yet
    if (get().solBalance === null) {
      set({ isSolLoading: true });
    }
    set({ solError: null }) // Always clear previous error

    const apiUrl = process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL

    try {
      const response = await fetch(`${apiUrl}/wallet/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching balance/price from main-api (store):', response.status, errorData)
        throw new Error(errorData.error || `Main API HTTP error! status: ${response.status}`)
      }

      const data: BalancePriceResponse = await response.json()

      set({
        solBalance: data.balance, // Update balance
        solPrice: data.price ?? null,     // Update price
        isSolLoading: false,      // Mark loading as complete
        solError: null            // Clear any previous error
      })

      if (data.price === null) {
        console.warn('Received balance, but price was null from API.')
        // Optionally set a specific warning message if needed
        // set({ solError: 'Could not fetch current price.' })
      }

    } catch (err) {
      console.error('Failed to fetch balance/price from main-api (store):', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      set({ solBalance: null, solPrice: null, isSolLoading: false, solError: errorMessage })
    }
  },

  fetchTeamBalance: async () => {
    const token = useAuthStore.getState().token
    const user = useAuthStore.getState().user

    if (!token) {
      set({ teamBalance: null, isTeamLoading: false, teamError: null, teamPrice: null })
      // No need to stop polling here, fetchSolBalance handles it
      return
    }

    // Only set loading if balance hasn't been fetched yet
    if (get().teamBalance === null) {
      set({ isTeamLoading: true });
    }
    set({ teamError: null }); // Always clear previous error

    const apiUrl = process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL

    try {
      const response = await fetch(`${apiUrl}/wallet/balance/team`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching balance/price from main-api (store):', response.status, errorData)
        throw new Error(errorData.error || `Main API HTTP error! status: ${response.status}`)
      }

      const data: BalancePriceResponse = await response.json()

      set({
        teamBalance: data.balance, // Update balance
        teamPrice: data.price ?? null,     // Update price
        isTeamLoading: false,      // Mark loading as complete
        teamError: null            // Clear any previous error
      })

      if (data.price === null) {
        console.warn('Received balance, but price was null from API.')
        // Optionally set a specific warning message if needed
        // set({ teamError: 'Could not fetch current price.' })
      }

    } catch (err) {
      console.error('Failed to fetch balance/price from main-api (store):', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      set({ teamBalance: null, teamPrice: null, isTeamLoading: false, teamError: errorMessage })
    }
  },

  startPolling: () => {
    const { pollingIntervalId, fetchSolBalance, fetchTeamBalance } = get()
    const token = useAuthStore.getState().token

    // Prevent multiple intervals and ensure token exists
    if (pollingIntervalId || !token) {
      console.log('Polling not started: already running or no token.')
      return
    }

    console.log('Starting wallet balance polling...')

    // Fetch immediately first time
    fetchSolBalance()
    fetchTeamBalance()

    // Start interval
    const intervalId = setInterval(() => {
      console.log('Polling wallet balances...')
      const currentToken = useAuthStore.getState().token // Check token validity inside interval
      if (currentToken) {
        fetchSolBalance()
        fetchTeamBalance()
      } else {
        console.log('Token expired or user logged out. Stopping polling.')
        get().stopPolling() // Stop if token becomes invalid
      }
    }, POLLING_INTERVAL_MS)

    set({ pollingIntervalId: intervalId })
  },

  stopPolling: () => {
    const { pollingIntervalId } = get()
    if (pollingIntervalId) {
      console.log('Stopping wallet balance polling...')
      clearInterval(pollingIntervalId)
      set({ pollingIntervalId: null })
    }
  }
}))

// Optional: Listen to auth changes to automatically start/stop polling
// useAuthStore.subscribe((state) => {
//   if (state.token) {
//     useWalletStore.getState().startPolling()
//   } else {
//     useWalletStore.getState().stopPolling()
//   }
// })

// Example of how to use in a component (e.g., main layout or dashboard):
// useEffect(() => {
//   const { startPolling, stopPolling } = useWalletStore.getState();
//   const token = useAuthStore.getState().token;

//   if (token) {
//     startPolling();
//   }

//   return () => {
//     stopPolling(); // Cleanup on unmount
//   };
// }, []); // Dependency array might need adjustment based on where it's used

// Note: Consider potential race conditions if fetches take longer than the interval.
// A more robust solution might use recursive setTimeout or a dedicated background task library.
