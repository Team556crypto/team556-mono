import { apiClient } from './client';
import type {
  User,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationResponse,
} from './types';

/**
 * Fetches the current authenticated user's profile.
 * @param token - The authentication token.
 * @returns A promise that resolves with the user's profile data.
 * @throws An ApiClientError if the request fails or the user is not authenticated.
 */
export const getUserProfile = async (token: string | null): Promise<User> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<User>({
    method: 'GET',
    endpoint: '/user/profile',
    token,
  });
};

/**
 * Makes a POST request to the email verification endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param code - The 6-digit verification code.
 * @returns A promise that resolves with the success message.
 * @throws An ApiClientError if the request fails or verification is unsuccessful.
 */
export const verifyEmail = async (
  token: string | null,
  code: string
): Promise<VerifyEmailResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  const payload: VerifyEmailRequest = { verification_code: code };
  return apiClient<VerifyEmailResponse>({
    method: 'POST',
    endpoint: '/user/verify-email',
    token,
    body: payload,
  });
};

/**
 * Makes a POST request to resend the verification email.
 * Requires authentication.
 * @param token - The authentication token.
 * @returns A promise that resolves with the success message.
 * @throws An ApiClientError if the request fails.
 */
export const resendVerificationEmail = async (
  token: string | null
): Promise<ResendVerificationResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<ResendVerificationResponse>({
    method: 'POST',
    endpoint: '/user/resend-verification',
    token,
  });
};
