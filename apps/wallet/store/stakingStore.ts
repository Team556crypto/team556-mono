import { create } from 'zustand';
import { combine, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Enums & Types for Hybrid Staking --- (Could be in a separate types file)
export type StakingOptionType = 'flexible' | 'fixed';

export interface StakingOption {
  id: string; // e.g., 'flexible_main', 'fixed_30_days_pool1'
  name: string; // User-friendly name, e.g., "Flexible Stake", "30-Day Lock"
  apy: number; // Annual Percentage Yield, e.g., 0.05 for 5%
  durationDays?: number; // For fixed-term, undefined or 0 for flexible
  type: StakingOptionType;
  description: string; // Brief description of the option
  minStakeAmount?: number;
  maxStakeAmount?: number;
  // Potentially add more details like contract address if options map to different contracts
}

export interface UserStakedPosition {
  positionId: string; // Unique ID for this specific stake by the user
  optionId: string; // Links to a StakingOption.id
  optionName?: string; // Denormalized for easier display, populated from StakingOption
  amountStaked: number;
  rewardsEarned: number;
  stakedDate: string; // ISO Date string
  unlockDate?: string; // ISO Date string, for fixed-term stakes
  // status: 'active' | 'unlocked' | 'closed'; // if needed
}
// --- End Types ---

// Define the state structure
interface StakingState {
  availableStakingOptions: StakingOption[];
  userStakedPositions: UserStakedPosition[];
  isLoading: boolean;
  error: string | null;
  // Potentially keep aggregated balances if useful for quick display, 
  // but primary data will be in userStakedPositions
  // totalStakedAcrossAllPositions: number;
  // totalRewardsAcrossAllPositions: number;
}

// Define the actions
interface StakingActions {
  fetchAvailableStakingOptions: () => Promise<void>;
  fetchUserStakedPositions: (walletAddress: string) => Promise<void>;
  stakeTeamToOption: (optionId: string, amount: number, walletAddress: string) => Promise<void>;
  unstakeFromPosition: (positionId: string, amount?: number, walletAddress?: string) => Promise<void>; // Amount optional if unstaking full position
  claimRewardsFromPosition: (positionId: string, walletAddress: string) => Promise<void>;
  resetStakingState: () => void;
}

const initialState: StakingState = {
  availableStakingOptions: [],
  userStakedPositions: [],
  isLoading: false,
  error: null,
};

export const useStakingStore = create<StakingState & StakingActions>()(
  persist(
    combine(initialState, (set, get, api): StakingActions => ({
      fetchAvailableStakingOptions: async () => {
        set({ isLoading: true, error: null });
        console.log('Fetching available staking options... (Placeholder)');
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          const options: StakingOption[] = [
            { id: 'flex_1', name: 'Flexible TEAM Stake', apy: 0.025, type: 'flexible', description: 'Stake and unstake anytime. Base APY.', minStakeAmount: 1000 },
            { id: 'fixed_30_v1', name: '30-Day Locked Stake', apy: 0.05, durationDays: 30, type: 'fixed', description: 'Earn higher APY with a 30-day lock.', minStakeAmount: 10000 },
            { id: 'fixed_90_v1', name: '90-Day Locked Stake', apy: 0.10, durationDays: 90, type: 'fixed', description: 'Better APY for a 90-day commitment.', minStakeAmount: 50000 },
            { id: 'fixed_180_v1', name: '180-Day Locked Stake', apy: 0.15, durationDays: 180, type: 'fixed', description: 'Maximize your APY with a 180-day commitment.', minStakeAmount: 100000 },
          ];
          set({ availableStakingOptions: options, isLoading: false });
        } catch (e: any) {
          console.error('Failed to fetch staking options:', e);
          set({ isLoading: false, error: e.message || 'Failed to fetch staking options' });
        }
      },

      fetchUserStakedPositions: async (walletAddress: string) => {
        if (!walletAddress) {
          set({ userStakedPositions: [], isLoading: false });
          return;
        }
        set({ isLoading: true, error: null });
        console.log(`Fetching user staked positions for ${walletAddress}... (Placeholder)`);
        try {
          // Simulate API call - in reality, this would fetch positions for the given walletAddress
          await new Promise(resolve => setTimeout(resolve, 1200));
          // Example: if user has staked before
          // const positions: UserStakedPosition[] = [
          //   {
          //     positionId: 'userstake_123',
          //     optionId: 'fixed_30_v1',
          //     optionName: '30-Day Locked Stake', // Usually enriched on client or by API
          //     amountStaked: 1000,
          //     rewardsEarned: 5.5,
          //     stakedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          //     unlockDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          //   }
          // ]; 
          // For now, assume no positions initially or clear them if refetching
          set({ userStakedPositions: [], isLoading: false });
        } catch (e: any) {
          console.error('Failed to fetch user positions:', e);
          set({ isLoading: false, error: e.message || 'Failed to fetch user positions' });
        }
      },

      stakeTeamToOption: async (optionId: string, amount: number, walletAddress: string) => {
        set({ isLoading: true, error: null });
        console.log(`Staking ${amount} TEAM into option ${optionId} for ${walletAddress}... (Placeholder)`);
        try {
          // Simulate API call to stake
          await new Promise(resolve => setTimeout(resolve, 1500));
          console.log('Stake successful (simulated).');
          // IMPORTANT: After staking, you MUST refetch user positions to see the new stake.
          // You might also get the new position back from the API and add it directly.
          set({ isLoading: false });
          await get().fetchUserStakedPositions(walletAddress); // Refresh positions
          // Optionally, also refresh available options if balances/capacities change
          // await get().fetchAvailableStakingOptions(); 
        } catch (e: any) {
          console.error('Failed to stake team:', e);
          set({ isLoading: false, error: e.message || 'Failed to stake TEAM' });
          throw e; // Re-throw to allow UI to catch and display specific error
        }
      },

      unstakeFromPosition: async (positionId: string, amount?: number, walletAddress?: string) => {
        set({ isLoading: true, error: null });
        console.log(`Unstaking from position ${positionId} (Amount: ${amount || 'all'})... (Placeholder)`);
        try {
          // Simulate API call to unstake
          // Backend would handle logic for flexible (anytime) vs fixed (only after unlockDate or with penalty)
          await new Promise(resolve => setTimeout(resolve, 1500));
          console.log('Unstake successful (simulated).');
          set({ isLoading: false });
          if (walletAddress) {
            await get().fetchUserStakedPositions(walletAddress); // Refresh positions
          }
        } catch (e: any) {
          console.error('Failed to unstake:', e);
          set({ isLoading: false, error: e.message || 'Failed to unstake' });
          throw e;
        }
      },

      claimRewardsFromPosition: async (positionId: string, walletAddress: string) => {
        set({ isLoading: true, error: null });
        console.log(`Claiming rewards from position ${positionId} for ${walletAddress}... (Placeholder)`);
        try {
          // Simulate API call to claim rewards
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Claim rewards successful (simulated).');
          set({ isLoading: false });
          await get().fetchUserStakedPositions(walletAddress); // Refresh positions to show updated rewards
        } catch (e: any) {
          console.error('Failed to claim rewards:', e);
          set({ isLoading: false, error: e.message || 'Failed to claim rewards' });
          throw e;
        }
      },
      
      resetStakingState: () => {
        set(initialState);
      },
    })),
    {
      name: 'staking-storage-v2', // Changed name to avoid conflict with old structure if necessary
      storage: createJSONStorage(() => AsyncStorage),
      // Consider which parts of the state to persist. 
      // Persisting availableStakingOptions might be fine if they don't change often, 
      // but userStakedPositions are sensitive and tied to a wallet.
      // Typically, dynamic data like options and positions are fetched on load rather than persisted long-term.
      // For simplicity here, default behavior is to persist all.
      // partialize: (state) => ({ ... }), // Example to select what to persist
    }
  )
);
