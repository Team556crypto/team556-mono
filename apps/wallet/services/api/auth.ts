import { apiClient } from './client';
import type {
  UserCredentials,
  LoginResponse,
  ApiErrorResponse,
} from './types';

/**
 * Makes a POST request to the login endpoint.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves with the login response (token and user).
 * @throws An ApiClientError if the login fails or the request is unsuccessful.
 */
export const loginUser = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  return apiClient<LoginResponse>({
    method: 'POST',
    endpoint: '/auth/login',
    body: credentials,
  });
};

/**
 * Makes a POST request to the signup endpoint.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves with the signup response (token and user).
 * @throws An ApiClientError if the signup fails or the request is unsuccessful.
 */
export const signupUser = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  return apiClient<LoginResponse>({
    method: 'POST',
    endpoint: '/auth/signup',
    body: credentials,
  });
};

/**
 * Makes a POST request to the logout endpoint.
 * @param token - The authentication token.
 * @returns A promise that resolves if logout is successful on the server.
 * @throws An ApiClientError if the logout fails or the request is unsuccessful.
 */
export const logoutUser = async (token: string | null): Promise<void> => {
  if (!token) {
    // Optionally handle this case, e.g., by resolving immediately
    // or throwing a specific error if a token is strictly required
    // For now, let's assume if there's no token, there's nothing to logout from the client's perspective.
    // However, the original function tries to make a call even with null, which would fail. 
    // A backend logout might still be useful to invalidate server-side sessions if any, even without a token.
    // Replicating original behavior for now by allowing the call to proceed, 
    // which will likely be rejected by apiClient if token is null and endpoint requires it.
  }
  return apiClient<void>({
    method: 'POST',
    endpoint: '/auth/logout',
    token,
  });
};
