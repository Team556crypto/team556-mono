import { create } from 'zustand'
import { Firearm, getFirearms, updateFirearm, UpdateFirearmPayload, createFirearm } from '@/services/api'
import type { CreateFirearmPayload } from '@/services/api'
import { useAuthStore } from './authStore';

// Define the state structure for the firearm store
interface FirearmState {
  firearms: Firearm[]
  isLoading: boolean
  error: string | null
  hasAttemptedInitialFetch: boolean
  addFirearm: (payload: CreateFirearmPayload, token: string | null) => Promise<boolean>
  updateFirearm: (firearmId: number, payload: UpdateFirearmPayload, token: string | null) => Promise<void>
  _updateLocalFirearm: (updatedFirearm: Firearm) => void
  removeFirearm: (firearmId: number) => void
  setFirearms: (firearms: Firearm[]) => void
  getFirearmById: (firearmId: number) => Firearm | undefined
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchInitialFirearms: (token: string | null) => Promise<void>
}

// Create the Zustand store
export const useFirearmStore = create<FirearmState>((set, get) => ({
  firearms: [], // Initial state: empty array
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  // Action to add a new firearm
  addFirearm: async (payload, token) => {
    // Check if user can add more items
    if (!useAuthStore.getState().canAddItem()) {
      set({ 
        isLoading: false, 
        error: 'Item limit reached. Standard users can add up to 2 items. P1 presale members have unlimited additions.' 
      });
      console.debug('[FirearmStore] Add firearm prevented: User item limit reached.');
      return false;
    }

    set({ isLoading: true, error: null })
    console.debug('[FirearmStore] Attempting to add new firearm via API...')
    try {
      const newFirearmFromApi = await createFirearm(payload, token)
      set(state => ({
        firearms: [...state.firearms, newFirearmFromApi],
        isLoading: false
      }))
      console.debug('[FirearmStore] New firearm added successfully:', newFirearmFromApi)
      return true
    } catch (error: any) {
      console.error('[FirearmStore] Failed to add new firearm:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add firearm'
      set({ error: errorMessage, isLoading: false })
      return false
    }
  },

  // Internal action to update an existing firearm in local state
  _updateLocalFirearm: updatedFirearm =>
    set(state => ({
      firearms: state.firearms.map(f => (f.id === updatedFirearm.id ? updatedFirearm : f))
    })),

  // Action to update firearm via API and then update local state
  updateFirearm: async (firearmId, payload, token) => {
    const currentFirearm = get().firearms.find(f => f.id === firearmId)
    if (!currentFirearm) {
      console.error(`[FirearmStore] Firearm with id ${firearmId} not found for update.`)
      throw new Error(`Firearm with id ${firearmId} not found.`)
    }

    set({ isLoading: true, error: null })
    console.debug(`[FirearmStore] Attempting to update firearm ${firearmId} via API...`)
    try {
      const updatedFirearmFromApi = await updateFirearm(firearmId, payload, token)
      get()._updateLocalFirearm(updatedFirearmFromApi) // Use internal action to update state
      set({ isLoading: false })
      console.debug(`[FirearmStore] Firearm ${firearmId} updated successfully.`)
    } catch (error: any) {
      console.error(`[FirearmStore] Failed to update firearm ${firearmId}:`, error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update firearm'
      set({ error: errorMessage, isLoading: false })
      throw error // Re-throw to allow UI to handle it if needed
    }
  },

  // Action to remove a firearm by its ID
  removeFirearm: firearmId =>
    set(state => ({
      firearms: state.firearms.filter(f => f.id !== firearmId)
    })),

  // Action to replace the entire firearms array
  setFirearms: firearms => set({ firearms }),

  // Getter function to retrieve a firearm by ID
  getFirearmById: firearmId => {
    return get().firearms.find(f => f.id === firearmId)
  },

  // Action to fetch initial batch of firearms
  fetchInitialFirearms: async token => {
    set({ isLoading: true, error: null })
    console.debug('[FirearmStore] Fetching initial firearms...')
    try {
      const fetchedFirearms = await getFirearms(token, { limit: 10 }) // Call actual API
      console.debug(`[FirearmStore] Fetched ${fetchedFirearms.length} firearms.`)
      set({ firearms: fetchedFirearms, isLoading: false, hasAttemptedInitialFetch: true })
    } catch (error: any) {
      console.error('[FirearmStore] Failed to fetch firearms:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch firearms'
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true })
    }
  }
}))
