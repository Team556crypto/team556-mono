import { apiClient } from './client';
import type { NFA, CreateNFAPayload, UpdateNFAPayload } from '@team556/ui';

/**
 * Fetches the list of NFA items for the authenticated user.
 * @param token - The authentication token.
 * @returns A promise that resolves with an array of the user's NFA items.
 */
export const getNFAItems = async (token: string | null): Promise<NFA[]> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<NFA[]>({
    method: 'GET',
    endpoint: '/nfa',
    token,
  });
};

/**
 * Creates a new NFA item.
 * @param payload - The data for the new NFA item.
 * @param token - The authentication token.
 * @returns A promise that resolves with the created NFA item data.
 */
export const createNFAItem = async (payload: CreateNFAPayload, token: string | null): Promise<NFA> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<NFA>({
    method: 'POST',
    endpoint: '/nfa',
    token,
    body: payload,
  });
};

/**
 * Updates an existing NFA item.
 * @param nfaId - The ID of the NFA item to update.
 * @param payload - The data to update for the NFA item.
 * @param token - The authentication token.
 * @returns A promise that resolves with the updated NFA item data.
 */
export const updateNFAItem = async (
  nfaId: number,
  payload: UpdateNFAPayload,
  token: string | null
): Promise<NFA> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<NFA>({
    method: 'PUT',
    endpoint: `/nfa/${nfaId}`,
    token,
    body: payload,
  });
};

/**
 * Deletes an NFA item.
 * @param nfaId - The ID of the NFA item to delete.
 * @param token - The authentication token.
 * @returns A promise that resolves when the NFA item is deleted.
 */
export const deleteNFAItem = async (nfaId: number, token: string | null): Promise<void> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<void>({
    method: 'DELETE',
    endpoint: `/nfa/${nfaId}`,
    token,
  });
};
