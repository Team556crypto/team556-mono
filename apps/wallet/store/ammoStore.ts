import { create } from 'zustand'
import { Ammo, getAmmos, updateAmmo, UpdateAmmoPayload, createAmmo, CreateAmmoPayload, deleteAmmo } from '@/services/api'
import { useAuthStore } from './authStore';

// Define the state structure for the ammo store
interface AmmoState {
  ammos: Ammo[];
  isLoading: boolean;
  error: string | null;
  hasAttemptedInitialFetch: boolean;
  addAmmo: (payload: CreateAmmoPayload, token: string | null) => Promise<boolean>;
  updateAmmo: (ammoId: number, payload: UpdateAmmoPayload, token: string | null) => Promise<void>;
  deleteAmmo: (ammoId: number, token: string | null) => Promise<void>;
  _updateLocalAmmo: (updatedAmmo: Ammo) => void;
  setAmmos: (ammos: Ammo[]) => void;
  getAmmoById: (ammoId: number) => Ammo | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchInitialAmmos: (token: string | null) => Promise<void>;
}

// Create the Zustand store
export const useAmmoStore = create<AmmoState>((set, get) => ({
  ammos: [], // Initial state: empty array
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  // Action to add new ammunition
  addAmmo: async (payload, token) => {
    if (!useAuthStore.getState().canAddItem()) {
      set({
        isLoading: false,
        error: 'Item limit reached. Standard users can add up to 2 items. P1 presale members have unlimited additions.'
      });
      console.debug('[AmmoStore] Add ammo prevented: User item limit reached.');
      return false;
    }

    const { ammos, updateAmmo: updateAmmoAction } = get();

    const existingAmmo = ammos.find(a =>
        a.manufacturer.toLowerCase() === payload.manufacturer.toLowerCase() &&
        a.caliber.toLowerCase() === payload.caliber.toLowerCase() &&
        a.type.toLowerCase() === payload.type.toLowerCase() &&
        a.grainWeight === payload.grainWeight
    );

    if (existingAmmo) {
      console.debug(`[AmmoStore] Found existing ammo with id ${existingAmmo.id}, updating...`);
      
      const newQuantity = existingAmmo.quantity + payload.quantity;
      const updatePayload: UpdateAmmoPayload = {
        id: existingAmmo.id,
        quantity: newQuantity,
      };

      // Merge notes
      if (payload.notes) {
        updatePayload.notes = [existingAmmo.notes, payload.notes].filter(Boolean).join('\n---\n');
      }

      // Merge pictures
      if (payload.pictures) {
        try {
            const existingPictures = existingAmmo.pictures ? JSON.parse(existingAmmo.pictures) : [];
            const newPictures = JSON.parse(payload.pictures);
            if (Array.isArray(existingPictures) && Array.isArray(newPictures)) {
                const combinedPictures = [...new Set([...existingPictures, ...newPictures])];
                updatePayload.pictures = JSON.stringify(combinedPictures);
            }
        } catch(e) {
            console.error("[AmmoStore] Error parsing or merging pictures JSON", e);
        }
      }

      try {
        await updateAmmoAction(existingAmmo.id, updatePayload, token);
        return true;
      } catch (error) {
        return false;
      }
    }

    // If no existing ammo, create a new one with optimistic update
    const tempId = Date.now();
    const tempAmmo: Ammo = {
      ...payload,
      id: tempId,
      owner_user_id: useAuthStore.getState().user?.id || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set(state => ({ ammos: [...state.ammos, tempAmmo] }));
    console.debug('[AmmoStore] Optimistically added new ammo with temp ID:', tempId);

    try {
      const newAmmoFromApi = await createAmmo(payload, token);
      set(state => ({
        ammos: state.ammos.map(a => (a.id === tempId ? newAmmoFromApi : a)),
        isLoading: false
      }));
      console.debug('[AmmoStore] New ammo added successfully:', newAmmoFromApi);
      return true;
    } catch (error: any) {
      console.error('[AmmoStore] Failed to add new ammo:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add ammo';
      set(state => ({
        error: errorMessage,
        isLoading: false,
        ammos: state.ammos.filter(a => a.id !== tempId) // Rollback optimistic update
      }));
      return false;
    }
  },

  // Internal action to update an existing ammo entry in local state
  _updateLocalAmmo: updatedAmmo =>
    set(state => ({
      ammos: state.ammos.map(a => (a.id === updatedAmmo.id ? updatedAmmo : a))
    })),

  // Action to update ammo via API and then update local state
  updateAmmo: async (ammoId, payload, token) => {
    const currentAmmo = get().ammos.find(a => a.id === ammoId);
    if (!currentAmmo) {
      console.error(`[AmmoStore] Ammo with id ${ammoId} not found for update.`);
      throw new Error(`Ammo with id ${ammoId} not found.`);
    }

    set({ isLoading: true, error: null });
    console.debug(`[AmmoStore] Attempting to update ammo ${ammoId} via API...`);
    try {
      const updatedAmmoFromApi = await updateAmmo(ammoId, payload, token);
      get()._updateLocalAmmo(updatedAmmoFromApi); // Use internal action to update state
      set({ isLoading: false });
      console.debug(`[AmmoStore] Ammo ${ammoId} updated successfully.`);
    } catch (error: any) {
      console.error(`[AmmoStore] Failed to update ammo ${ammoId}:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update ammo';
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw to allow UI to handle it if needed
    }
  },

  deleteAmmo: async (ammoId: number, token: string | null) => {
    if (!token) {
      const errorMsg = 'Authentication token is missing, cannot delete ammo.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }

    set({ isLoading: true, error: null });
    try {
      await deleteAmmo(ammoId, token);
      set(state => ({
        ammos: state.ammos.filter(a => a.id !== ammoId),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: `Failed to delete ammo: ${errorMessage}`, isLoading: false });
      // After a failed deletion, refetch the data to clear out any stale items
      console.log('Deletion failed, refetching ammo list to clear stale data...');
      get().fetchInitialAmmos(token);
      throw error; // Re-throw the error so the component can handle it if needed
    }
  },

  // Action to replace the entire ammos array
  setAmmos: ammos => set({ ammos }),

  // Getter function to retrieve an ammo entry by ID
  getAmmoById: ammoId => {
    return get().ammos.find(a => a.id === ammoId);
  },

  // Action to fetch initial batch of ammos
  fetchInitialAmmos: async token => {
    set({ isLoading: true, error: null });
    console.debug('[AmmoStore] Fetching initial ammos...');
    try {
      const fetchedAmmos = await getAmmos(token, { limit: 10 }); // Call actual API
      console.debug(`[AmmoStore] Fetched ${fetchedAmmos.length} ammos.`);
      set({ ammos: fetchedAmmos, isLoading: false, hasAttemptedInitialFetch: true });
    } catch (error: any) {
      console.error('[AmmoStore] Failed to fetch ammos:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch ammos';
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true });
    }
  }
}));
