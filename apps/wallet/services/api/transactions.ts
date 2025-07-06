import { apiClient } from './client';
import type {
  GetTransactionsRequest,
  GetTransactionsResponse,
} from './types';

/**
 * Fetches transaction history for a given wallet address.
 * Requires authentication.
 * @param token - The authentication token.
 * @param address - The wallet address to fetch transactions for.
 * @param limit - Optional limit for the number of transactions to return.
 * @returns A promise that resolves with the list of transactions.
 * @throws An ApiClientError if the request fails.
 */
export const getTransactions = async (
  token: string | null,
  address: string,
  limit?: number
): Promise<GetTransactionsResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  const payload: GetTransactionsRequest = { address, limit };
  return apiClient<GetTransactionsResponse>({
    method: 'POST',
    endpoint: '/wallet/transactions',
    token,
    body: payload,
  });
};
