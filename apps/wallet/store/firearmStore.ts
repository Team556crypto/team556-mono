import { create } from 'zustand';
import { Firearm, getFirearms } from '@/services/api';

// Define the state structure for the firearm store
interface FirearmState {
  firearms: Firearm[];
  isLoading: boolean;
  error: string | null;
  hasAttemptedInitialFetch: boolean;
  addFirearm: (firearm: Firearm) => void;
  updateFirearm: (updatedFirearm: Firearm) => void;
  removeFirearm: (firearmId: number) => void;
  setFirearms: (firearms: Firearm[]) => void;
  getFirearmById: (firearmId: number) => Firearm | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchInitialFirearms: (token: string | null) => Promise<void>;
}

// Create the Zustand store
export const useFirearmStore = create<FirearmState>((set, get) => ({
  firearms: [], // Initial state: empty array
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Action to add a new firearm
  addFirearm: (firearm) =>
    set((state) => ({
      firearms: [...state.firearms, firearm],
    })),

  // Action to update an existing firearm
  updateFirearm: (updatedFirearm) =>
    set((state) => ({
      firearms: state.firearms.map((f) =>
        f.id === updatedFirearm.id ? updatedFirearm : f
      ),
    })),

  // Action to remove a firearm by its ID
  removeFirearm: (firearmId) =>
    set((state) => ({
      firearms: state.firearms.filter((f) => f.id !== firearmId),
    })),

  // Action to replace the entire firearms array
  setFirearms: (firearms) =>
    set({ firearms }),

  // Getter function to retrieve a firearm by ID
  getFirearmById: (firearmId) => {
    return get().firearms.find((f) => f.id === firearmId);
  },

  // Action to fetch initial batch of firearms
  fetchInitialFirearms: async (token) => {
    set({ isLoading: true, error: null });
    console.debug('[FirearmStore] Fetching initial firearms...');
    try {
      const fetchedFirearms = await getFirearms(token, { limit: 10 }); // Call actual API
      console.debug(`[FirearmStore] Fetched ${fetchedFirearms.length} firearms.`);
      set({ firearms: fetchedFirearms, isLoading: false, hasAttemptedInitialFetch: true });
    } catch (error: any) {
      console.error('[FirearmStore] Failed to fetch firearms:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch firearms';
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true });
    }
  },
}));
