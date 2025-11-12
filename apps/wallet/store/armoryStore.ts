import { create } from 'zustand';
import { getArmoryCounts } from '@/services/api';
import type { ArmoryCounts } from '@/services/api';
import { useAuthStore } from './authStore';

// Define the state structure for the armory store
interface ArmoryState {
  counts: ArmoryCounts | null;
  isLoading: boolean;
  error: string | null;
  fetchCounts: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create the Zustand store
export const useArmoryStore = create<ArmoryState>((set) => ({
  counts: null,
  isLoading: false,
  error: null,
  
  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Set error state
  setError: (error) => set({ error }),
  
  // Reset store state
  reset: () => set({ counts: null, isLoading: false, error: null }),
  
  // Action to fetch armory counts
  fetchCounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const counts = await getArmoryCounts(token);
      console.debug('[ArmoryStore] Armory counts fetched successfully:', counts);
      set({ counts, isLoading: false });
    } catch (error: any) {
      console.error('[ArmoryStore] Failed to fetch armory counts:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch armory counts';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));