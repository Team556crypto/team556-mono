import { create } from 'zustand';
import { getNFAItems, createNFAItem, updateNFAItem, deleteNFAItem } from '@/services/api';
import type { NFA, CreateNFAPayload, UpdateNFAPayload } from '@team556/ui';
import { useAuthStore } from './authStore';

// Define the state structure for the NFA store
interface NFAState {
  nfaItems: NFA[];
  isLoading: boolean;
  error: string | null;
  hasAttemptedInitialFetch: boolean;
  addNFAItem: (payload: CreateNFAPayload, token: string | null) => Promise<boolean>;
  updateNFAItem: (nfaId: number, payload: UpdateNFAPayload, token: string | null) => Promise<void>;
  deleteNFAItem: (nfaId: number, token: string | null) => Promise<void>;
  getNFAItemById: (nfaId: number) => NFA | undefined;
  fetchInitialNFAItems: (token: string | null) => Promise<void>;
  setError: (error: string | null) => void;
}

// Create the Zustand store
export const useNFAStore = create<NFAState>((set, get) => ({
  nfaItems: [],
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setError: error => set({ error }),

  // Action to add a new NFA item
  addNFAItem: async (payload, token) => {
    if (!useAuthStore.getState().canAddItem()) {
      set({ 
        isLoading: false, 
        error: 'Item limit reached. Standard users can add up to 2 items. P1 presale members have unlimited additions.' 
      });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const newNFAItem = await createNFAItem(payload, token);
      set(state => ({ nfaItems: [...state.nfaItems, newNFAItem], isLoading: false }));
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add NFA item';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Action to update an existing NFA item
  updateNFAItem: async (nfaId, payload, token) => {
    set({ isLoading: true, error: null });
    try {
      const updatedNFAItem = await updateNFAItem(nfaId, payload, token);
      set(state => ({
        nfaItems: state.nfaItems.map(item => (item.id === nfaId ? updatedNFAItem : item)),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update NFA item';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Action to delete an NFA item
  deleteNFAItem: async (nfaId, token) => {
    set({ isLoading: true, error: null });
    try {
      await deleteNFAItem(nfaId, token);
      set(state => ({
        nfaItems: state.nfaItems.filter(item => item.id !== nfaId),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete NFA item';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Getter function to retrieve an NFA item by ID
  getNFAItemById: nfaId => {
    return get().nfaItems.find(item => item.id === nfaId);
  },

  // Action to fetch initial batch of NFA items
  fetchInitialNFAItems: async token => {
    if (get().hasAttemptedInitialFetch) return;
    set({ isLoading: true, error: null });
    try {
      const fetchedNFAItems = await getNFAItems(token);
      set({ 
        nfaItems: fetchedNFAItems.map(n => ({ ...n, value: Number(n.value || 0) })),
        isLoading: false, 
        hasAttemptedInitialFetch: true 
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch NFA items';
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true });
    }
  },
}));
