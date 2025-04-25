import { create } from 'zustand'
import { useAuthStore } from './authStore'

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
}

export const useWalletStore = create<WalletState>((set, get) => ({
  solBalance: null,
  solPrice: null,
  isSolLoading: false,
  solError: null,

  teamBalance: null,
  teamPrice: null,
  isTeamLoading: false,
  teamError: null,

  fetchSolBalance: async () => {
    const token = useAuthStore.getState().token
    const user = useAuthStore.getState().user

    if (!token) { 
      set({ solBalance: null, isSolLoading: false, solError: null, solPrice: null })
      return
    }

    set({ isSolLoading: true, solError: null, solBalance: get().solBalance, solPrice: get().solPrice })
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
        solBalance: data.balance,
        solPrice: data.price ?? null, 
        isSolLoading: false 
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
      return
    }

    set({ isTeamLoading: true, teamError: null, teamBalance: get().teamBalance, teamPrice: get().teamPrice })
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
        teamBalance: data.balance,
        teamPrice: data.price ?? null, 
        isTeamLoading: false 
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
  }
}))
