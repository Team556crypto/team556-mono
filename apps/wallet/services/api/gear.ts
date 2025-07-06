import { apiClient } from './client'
import type { Gear, UpdateGearPayload, CreateGearPayload } from '@team556/ui'

/**
 * Fetches the list of gear for the authenticated user.
 * @param token - The authentication token.
 * @param params - Optional query parameters (e.g., { limit: 10, page: 1 }).
 * @returns A promise that resolves with an array of the user's gear.
 * @throws An ApiClientError if the request fails or the user is not authenticated.
 */
export const getGear = async (
  token: string | null,
  params?: { limit?: number; page?: number }
): Promise<Gear[]> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Gear[]>({
    method: 'GET',
    endpoint: '/gear',
    token,
    params
  })
}

/**
 * Updates an existing gear entry.
 * @param gearId - The ID of the gear to update.
 * @param payload - The data to update for the gear.
 * @param token - The authentication token.
 * @returns A promise that resolves with the updated gear data.
 * @throws An ApiClientError if the request fails.
 */
export const updateGear = async (
  gearId: number,
  payload: UpdateGearPayload,
  token: string | null
): Promise<Gear> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Gear>({
    method: 'PATCH',
    endpoint: `/gear/${gearId}`,
    token,
    body: payload
  })
}

/**
 * Creates new gear.
 * @param payload - The data for the new gear.
 * @param token - The authentication token.
 * @returns A promise that resolves with the created gear data.
 * @throws An ApiClientError if the request fails.
 */
export const createGear = async (payload: CreateGearPayload, token: string | null): Promise<Gear> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Gear>({
    method: 'POST',
    endpoint: '/gear',
    token,
    body: payload
  })
}

/**
 * Deletes a gear item.
 * @param gearId - The ID of the gear to delete.
 * @param token - The authentication token.
 * @returns A promise that resolves when the gear is deleted.
 * @throws An ApiClientError if the request fails.
 */
export const deleteGear = async (gearId: number, token: string | null): Promise<void> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<void>({
    method: 'DELETE',
    endpoint: `/gear/${gearId}`,
    token,
  });
};
