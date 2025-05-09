import { apiClient } from './client';
import type {
  CheckPresaleCodeResponse,
  RedeemPresaleCodeRequest,
  RedeemPresaleCodeResponse,
} from './types';

/**
 * Checks the validity and status of a presale code.
 * @param code - The presale code to check.
 * @param token - The authentication token (might be optional depending on backend logic for this check).
 * @returns A promise that resolves with the check presale code response.
 * @throws An ApiClientError if the request fails.
 */
export const checkPresaleCode = async (
  code: string,
  token: string | null
): Promise<CheckPresaleCodeResponse> => {
  // Note: The original API file suggests this might be a GET request with the code in the path.
  // However, sending it as a query parameter for a GET, or in the body for a POST are also common.
  // Adjust endpoint and method as per your actual API design.
  // Assuming GET /presale/check/{code} for now as it's a common pattern for such checks.
  // If your API expects a POST or query params, this will need to change.
  
  // If token is required for this endpoint, add a check like in other services:
  // if (!token) {
  //   return Promise.reject(new Error('Authentication token not provided.'));
  // }
  
  return apiClient<CheckPresaleCodeResponse>({
    method: 'GET', // Or 'POST' if your backend expects that
    endpoint: `/presale/check/${code}`,
    token, // Pass token if needed, or remove if endpoint is public
    // If it's a POST request with the code in the body:
    // method: 'POST',
    // endpoint: '/presale/check',
    // body: { code }, 
    // token,
  });
};

/**
 * Redeems a presale code.
 * @param data - The request payload including the code and optional wallet address.
 * @param token - The authentication token.
 * @returns A promise that resolves with the redeem presale code response.
 * @throws An ApiClientError if the request fails.
 */
export const redeemPresaleCode = async (
  data: RedeemPresaleCodeRequest,
  token: string | null
): Promise<RedeemPresaleCodeResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<RedeemPresaleCodeResponse>({
    method: 'POST',
    endpoint: '/presale/redeem',
    token,
    body: data,
  });
};
