import { apiClient } from './client';

// Define the type for armory counts
export interface ArmoryCounts {
  firearms: number;
  ammo: number;
  gear: number;
  nfa: number;
  documents: number;
}

// Function to fetch armory counts
export const getArmoryCounts = async (token: string | null): Promise<ArmoryCounts> => {
  return apiClient<ArmoryCounts>({
    method: 'GET',
    endpoint: '/armory/counts',
    token,
  });
};