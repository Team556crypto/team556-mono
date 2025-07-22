import { create } from 'zustand'
import { getGear, updateGear, createGear, deleteGear } from '@/services/api';
import type { Gear, UpdateGearPayload, CreateGearPayload } from '@team556/ui';
import { useAuthStore } from './authStore';

// Define the state structure for the gear store
interface GearState {
  gear: Gear[];
  isLoading: boolean;
  error: string | null;
  hasAttemptedInitialFetch: boolean;
  addGear: (payload: CreateGearPayload, token: string | null) => Promise<boolean>;
  updateGear: (gearId: number, payload: UpdateGearPayload, token: string | null) => Promise<void>;
  deleteGear: (gearId: number, token: string | null) => Promise<void>;
  _updateLocalGear: (updatedGear: Gear) => void;
  setGear: (gear: Gear[]) => void;
  getGearById: (gearId: number) => Gear | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchInitialGear: (token: string | null) => Promise<void>;
}

// Create the Zustand store
export const useGearStore = create<GearState>((set, get) => ({
  gear: [], // Initial state: empty array
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  // Action to add new gear
  addGear: async (payload, token) => {
    const { gear, updateGear: updateGearAction } = get();

    const existingGear = gear.find(g =>
        g.name.toLowerCase() === payload.name.toLowerCase() &&
        g.manufacturer?.toLowerCase() === payload.manufacturer?.toLowerCase() &&
        g.model?.toLowerCase() === payload.model?.toLowerCase() &&
        g.type.toLowerCase() === payload.type.toLowerCase()
    );

    if (existingGear) {
      console.debug(`[GearStore] Found existing gear with id ${existingGear.id}, updating...`);
      
      const newQuantity = existingGear.quantity + payload.quantity;
      const updatePayload: UpdateGearPayload = {
        id: existingGear.id,
        quantity: newQuantity,
      };

      if (payload.notes) {
        updatePayload.notes = [existingGear.notes, payload.notes].filter(Boolean).join('\n---\n');
      }

      if (payload.pictures) {
        try {
            const existingPictures = existingGear.pictures ? JSON.parse(existingGear.pictures) : [];
            const newPictures = JSON.parse(payload.pictures);
            if (Array.isArray(existingPictures) && Array.isArray(newPictures)) {
                const combinedPictures = [...new Set([...existingPictures, ...newPictures])];
                updatePayload.pictures = JSON.stringify(combinedPictures);
            }
        } catch(e) {
            console.error("[GearStore] Error parsing or merging pictures JSON", e);
        }
      }

      try {
        await updateGearAction(existingGear.id, updatePayload, token);
        return true;
      } catch (error) {
        return false;
      }
    }

    const tempId = Date.now();
    const tempGear: Gear = {
      ...payload,
      id: tempId,
      owner_user_id: useAuthStore.getState().user?.id || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set(state => ({ gear: [...state.gear, tempGear] }));
    console.debug('[GearStore] Optimistically added new gear with temp ID:', tempId);

    try {
      const newGearFromApi = await createGear(payload, token);
      set(state => ({
        gear: state.gear.map(g => (g.id === tempId ? newGearFromApi : g)),
        isLoading: false
      }));
      console.debug('[GearStore] New gear added successfully:', newGearFromApi);
      return true;
    } catch (error: any) {
      console.error('[GearStore] Failed to add new gear:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add gear';
      set(state => ({ 
        error: errorMessage, 
        isLoading: false,
        gear: state.gear.filter(g => g.id !== tempId)
      }));
      return false;
    }
  },

  _updateLocalGear: updatedGear =>
    set(state => ({
      gear: state.gear.map(g => (g.id === updatedGear.id ? updatedGear : g))
    })),

  updateGear: async (gearId, payload, token) => {
    const currentGear = get().gear.find(g => g.id === gearId);
    if (!currentGear) {
      console.error(`[GearStore] Gear with id ${gearId} not found for update.`);
      throw new Error(`Gear with id ${gearId} not found.`);
    }

    set({ isLoading: true, error: null });
    console.debug(`[GearStore] Attempting to update gear ${gearId} via API...`);
    try {
      const updatedGearFromApi = await updateGear(gearId, payload, token);
      get()._updateLocalGear(updatedGearFromApi);
      set({ isLoading: false });
      console.debug(`[GearStore] Gear ${gearId} updated successfully.`);
    } catch (error: any) {
      console.error(`[GearStore] Failed to update gear ${gearId}:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update gear';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteGear: async (gearId, token) => {
    set({ isLoading: true, error: null });
    console.debug(`[GearStore] Attempting to delete gear ${gearId}...`);
    try {
      await deleteGear(gearId, token);
      set(state => ({
        gear: state.gear.filter(g => g.id !== gearId),
        isLoading: false,
      }));
      console.debug(`[GearStore] Gear ${gearId} deleted successfully.`);
    } catch (error: any) {
      console.error(`[GearStore] Failed to delete gear ${gearId}:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete gear';
      set({ error: errorMessage, isLoading: false });

      // After a failed deletion, refetch the data to clear out any stale items
      console.log('Deletion failed, refetching gear list to clear stale data...');
      get().fetchInitialGear(token);

      throw error;
    }
  },

  setGear: gear => set({ 
    gear: gear.map(g => ({ ...g, purchasePrice: Number(g.purchasePrice || 0) }))
  }),

  getGearById: gearId => {
    return get().gear.find(g => g.id === gearId);
  },

  fetchInitialGear: async token => {
    set({ isLoading: true, error: null });
    console.debug('[GearStore] Fetching initial gear...');
    try {
      const fetchedGear = await getGear(token, { limit: 10 });
      console.debug(`[GearStore] Fetched ${fetchedGear.length} gear items.`);
      set({ gear: fetchedGear, isLoading: false, hasAttemptedInitialFetch: true });
    } catch (error: any) {
      console.error('[GearStore] Failed to fetch gear:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch gear';
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true });
    }
  }
}));
