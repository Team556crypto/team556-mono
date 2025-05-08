import { apiClient } from './client';
import type {
  GetQuoteRequest,
  GetQuoteResponse,
  ExecuteSwapRequest,
  ExecuteSwapResponseWithStatus,
  SubmitTokenAccountsRequest,
  SubmitTokenAccountsResponse,
} from './types';

/**
 * Fetches a swap quote from the backend.
 * @param payload - The quote request details.
 * @param token - The user's auth token.
 * @returns A promise resolving to the quote response.
 * @throws An ApiClientError if the request fails.
 */
export const getSwapQuote = async (
  payload: GetQuoteRequest,
  token: string | null
): Promise<GetQuoteResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<GetQuoteResponse>({
    method: 'POST',
    endpoint: '/solana/swap/quote', // Assuming this is the correct endpoint
    token,
    body: payload,
  });
};

/**
 * Executes a swap transaction via the backend.
 * @param payload - The swap execution details (password and quote).
 * @param token - The user's auth token.
 * @returns A promise resolving to the swap execution response (tx signature or account creation details).
 * @throws An ApiClientError if the request fails.
 */
export const executeSwap = async (
  payload: ExecuteSwapRequest,
  token: string | null,
  // publicKey was passed in original function but not used in the apiClient call body directly, assuming it's part of ExecuteSwapRequest if needed by backend
): Promise<ExecuteSwapResponseWithStatus> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<ExecuteSwapResponseWithStatus>({
    method: 'POST',
    endpoint: '/solana/swap/execute', // Assuming this is the correct endpoint
    token,
    body: payload,
  });
};

/**
 * Submits a signed token account creation transaction to the backend.
 * @param signedTransaction - The base64 encoded signed transaction.
 * @param password - The user's password.
 * @param token - The user's auth token.
 * @returns A promise resolving to the transaction submission response.
 * @throws An ApiClientError if the request fails.
 */
export const submitTokenAccountTransaction = async (
  signedTransaction: string,
  password: string, // This was in the original function signature but not directly in SubmitTokenAccountsRequest from types.ts, added to payload
  token: string | null
): Promise<SubmitTokenAccountsResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  const payload: SubmitTokenAccountsRequest = { signedTransaction, password };
  return apiClient<SubmitTokenAccountsResponse>({
    method: 'POST',
    endpoint: '/solana/swap/submit-token-accounts', // Assuming this is the correct endpoint
    token,
    body: payload,
  });
};
