import { apiClient } from './client'
import type { Ammo, UpdateAmmoPayload, CreateAmmoPayload } from '@team556/ui'

/**
 * Fetches the list of ammunition for the authenticated user.
 * @param token - The authentication token.
 * @param params - Optional query parameters (e.g., { limit: 10, page: 1 }).
 * @returns A promise that resolves with an array of the user's ammunition.
 * @throws An ApiClientError if the request fails or the user is not authenticated.
 */
export const getAmmos = async (
  token: string | null,
  params?: { limit?: number; page?: number }
): Promise<Ammo[]> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Ammo[]>({
    method: 'GET',
    endpoint: '/ammos',
    token,
    params
  })
}

/**
 * Updates an existing ammunition entry.
 * @param ammoId - The ID of the ammunition to update.
 * @param payload - The data to update for the ammunition.
 * @param token - The authentication token.
 * @returns A promise that resolves with the updated ammunition data.
 * @throws An ApiClientError if the request fails.
 */
export const updateAmmo = async (
  ammoId: number,
  payload: UpdateAmmoPayload,
  token: string | null
): Promise<Ammo> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Ammo>({
    method: 'PATCH',
    endpoint: `/ammos/${ammoId}`,
    token,
    body: payload
  })
}

/**
 * Creates new ammunition.
 * @param payload - The data for the new ammunition.
 * @param token - The authentication token.
 * @returns A promise that resolves with the created ammunition data.
 * @throws An ApiClientError if the request fails.
 */
export const createAmmo = async (payload: CreateAmmoPayload, token: string | null): Promise<Ammo> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'))
  }
  return apiClient<Ammo>({
    method: 'POST',
    endpoint: '/ammos',
    token,
    body: payload
  })
}
