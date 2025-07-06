import { create } from 'zustand'
import { getTransactions } from '@/services/api/transactions'
import type { Transaction } from '@/services/api/types'
import { useAuthStore } from './authStore'

// Define the polling interval in milliseconds
const POLLING_INTERVAL_MS = 10000 // 10 seconds

interface BalancePriceResponse {
  balance: number
  price?: number | null
}

interface WalletState {
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  normalizeTransactions: (transactions: Transaction[]) => Transaction[];
  fetchTransactions: (limit?: number) => Promise<void>;

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

  transactions: [],
  transactionsLoading: false,
  transactionsError: null,

  // Helper function to normalize transaction types and detect Team556 Pay transactions
  normalizeTransactions: (transactions: Transaction[]): Transaction[] => {
    
    return transactions.map(transaction => {
      // Create a copy of the transaction to avoid mutating the original
      const normalizedTransaction = { ...transaction };
      
      // Check if this is already explicitly marked as a Team556 Pay transaction
      if (transaction.type.toLowerCase() === 'team556 pay' || 
          transaction.type.toLowerCase() === 'team556pay') {
        normalizedTransaction.type = 'Team556 Pay';
        if (!normalizedTransaction.businessName) {
          normalizedTransaction.businessName = 'Team556 Merchant';
        }
        return normalizedTransaction;
      }
      
      // Check for the new structured memo format.
      if (transaction.memo && transaction.memo.startsWith('Team556 Pay')) {
        normalizedTransaction.type = 'Team556 Pay';

        // Extract business name from the structured memo.
        const businessMatch = transaction.memo.match(/Business: ([^|]+)/);
        if (businessMatch && businessMatch[1]) {
          normalizedTransaction.businessName = businessMatch[1].trim();
        } else {
          normalizedTransaction.businessName = 'Team556 Merchant';
        }
        // Removed console.log statement
      }
      
      // Look for payment receipt information in the transaction data
      // This is a fallback for transactions that might not have memo data
      if (transaction.businessName || transaction.businessId) {
        normalizedTransaction.type = 'Team556 Pay';
        if (!normalizedTransaction.businessName) {
          normalizedTransaction.businessName = 'Team556 Merchant';
        }
      }
      
      return normalizedTransaction;
    });
  },

  fetchTransactions: async (limit?: number) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user?.wallets?.[0]?.address) {
      set({ transactions: [], transactionsLoading: false, transactionsError: 'User or wallet not found.' });
      return;
    }

    set({ transactionsLoading: true, transactionsError: null });

    try {
      const response = await getTransactions(token, user.wallets[0].address, limit);
      // Normalize transaction types before setting state
      const normalizedTransactions = get().normalizeTransactions(response.transactions);
      set({ transactions: normalizedTransactions, transactionsLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      set({ transactions: [], transactionsLoading: false, transactionsError: errorMessage });
    }
  },

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
      set({ isSolLoading: true })
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
        solPrice: data.price ?? null, // Update price
        isSolLoading: false, // Mark loading as complete
        solError: null // Clear any previous error
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
      set({ isTeamLoading: true })
    }
    set({ teamError: null }) // Always clear previous error

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
        teamPrice: data.price ?? null, // Update price
        isTeamLoading: false, // Mark loading as complete
        teamError: null // Clear any previous error
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
      return
    }

    // Fetch immediately first time
    fetchSolBalance()
    fetchTeamBalance()

    // Start interval
    const intervalId = setInterval(() => {
      const currentToken = useAuthStore.getState().token // Check token validity inside interval
      if (currentToken) {
        fetchSolBalance()
        fetchTeamBalance()
      } else {
        get().stopPolling() // Stop if token becomes invalid
      }
    }, POLLING_INTERVAL_MS)

    set({ pollingIntervalId: intervalId })
  },

  stopPolling: () => {
    const { pollingIntervalId } = get()
    if (pollingIntervalId) {
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
