import { apiClient } from './client';
import type {
  Firearm,
  UpdateFirearmPayload,
} from './types';

/**
 * Fetches the list of firearms for the authenticated user.
 * @param token - The authentication token.
 * @param params - Optional query parameters (e.g., { limit: 10, page: 1 }).
 * @returns A promise that resolves with an array of the user's firearms.
 * @throws An ApiClientError if the request fails or the user is not authenticated.
 */
export const getFirearms = async (
  token: string | null,
  params?: { limit?: number; page?: number }
): Promise<Firearm[]> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<Firearm[]>({
    method: 'GET',
    endpoint: '/firearms',
    token,
    params,
  });
};

/**
 * Updates an existing firearm.
 * @param firearmId - The ID of the firearm to update.
 * @param payload - The data to update for the firearm.
 * @param token - The authentication token.
 * @returns A promise that resolves with the updated firearm data.
 * @throws An ApiClientError if the request fails.
 */
export const updateFirearm = async (
  firearmId: number,
  payload: UpdateFirearmPayload,
  token: string | null
): Promise<Firearm> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<Firearm>({
    method: 'PATCH', // Or 'PUT' depending on your API design
    endpoint: `/firearms/${firearmId}`,
    token,
    body: payload,
  });
};
