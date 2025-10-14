import { create } from 'zustand'
import { posWalletApi } from '@/services/api'
import type { POSWalletAddresses, POSWalletHealth, WalletAddressValidation } from '@/types/pos-wallet'
import { useAuthStore } from './authStore'

interface POSWalletState {
  addresses: POSWalletAddresses | null
  health: POSWalletHealth | null
  isLoading: boolean
  isValidating: boolean
  error: string | null

  // actions
  fetchWalletAddresses: () => Promise<void>
  getWalletHealth: () => Promise<void>
  updatePrimaryAddress: (address: string) => Promise<void>
  updateSecondaryAddress: (address: string) => Promise<void>
  clearSecondaryAddress: () => Promise<void>
  validateAddress: (address: string) => Promise<WalletAddressValidation>
  canAcceptTeam556: () => boolean
  reset: () => void
}

export const usePOSWalletStore = create<POSWalletState>((set, get) => ({
  addresses: null,
  health: null,
  isLoading: false,
  isValidating: false,
  error: null,

  fetchWalletAddresses: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const addresses = await posWalletApi.getWalletAddresses(token)
      set({ addresses })
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch wallet addresses' })
    } finally {
      set({ isLoading: false })
    }
  },

  getWalletHealth: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      const health = await posWalletApi.getWalletHealth(token)
      set({ health })
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch wallet health' })
    } finally {
      set({ isLoading: false })
    }
  },

  updatePrimaryAddress: async (address: string) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      await posWalletApi.updatePrimaryAddress(token, address)
      await get().fetchWalletAddresses()
      await get().getWalletHealth()
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update primary wallet address' })
    } finally {
      set({ isLoading: false })
    }
  },

  updateSecondaryAddress: async (address: string) => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      await posWalletApi.updateSecondaryAddress(token, address)
      await get().fetchWalletAddresses()
      await get().getWalletHealth()
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update secondary wallet address' })
    } finally {
      set({ isLoading: false })
    }
  },

  clearSecondaryAddress: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      await posWalletApi.updateSecondaryAddress(token, '')
      await get().fetchWalletAddresses()
      await get().getWalletHealth()
    } catch (e: any) {
      set({ error: e?.message || 'Failed to clear secondary wallet address' })
    } finally {
      set({ isLoading: false })
    }
  },

  validateAddress: async (address: string) => {
    set({ isValidating: true })
    try {
      const token = useAuthStore.getState().token
      const result = await posWalletApi.validateAddress(token, address)
      return result as WalletAddressValidation
    } catch (e: any) {
      return { is_valid: false, message: e?.message || 'Validation failed' }
    } finally {
      set({ isValidating: false })
    }
  },

  canAcceptTeam556: () => {
    const h = get().health
    return !!(h && h.ready_for_payments === true)
  },

  reset: () => set({ addresses: null, health: null, isLoading: false, isValidating: false, error: null })
}))
