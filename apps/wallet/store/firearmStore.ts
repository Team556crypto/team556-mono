import { create } from 'zustand';

// Define the types for the firearm data
interface BallisticPerformance {
  velocity: number; // Consider units, e.g., ft/s or m/s
  energy: number;   // Consider units, e.g., ft-lbs or Joules
  accuracy: number; // Consider units/measure, e.g., MOA or MIL at a specific distance
}

export interface Firearm {
  id: number; // Consider using UUID string for better uniqueness
  name: string;
  type: string; // e.g., Pistol, Rifle, Shotgun
  caliber: string; // e.g., 9mm, 5.56 NATO, 12 Gauge
  serialNumber: string;
  purchaseDate?: Date | string; // Optional, use string if storing ISO format
  lastFired?: Date | string;    // Optional
  image?: string; // URL or path to the image
  manufacturer: string;
  model: string;
  roundCount: number;
  lastCleaned?: Date | string;  // Optional
  value?: number; // Optional currency value
  status: string; // e.g., Operational, In Storage, Needs Repair
  ballisticPerformance?: BallisticPerformance; // Optional performance data
}

// Define the store state and actions interface
interface FirearmState {
  firearms: Firearm[];
  addFirearm: (firearm: Firearm) => void;
  updateFirearm: (updatedFirearm: Firearm) => void;
  removeFirearm: (firearmId: number) => void;
  setFirearms: (firearms: Firearm[]) => void;
  getFirearmById: (firearmId: number) => Firearm | undefined;
}

// Create the Zustand store
export const useFirearmStore = create<FirearmState>((set, get) => ({
  firearms: [], // Initial state: empty array

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
}));
