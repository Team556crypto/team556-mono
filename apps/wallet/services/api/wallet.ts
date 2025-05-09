import { apiClient } from './client';
import type {
  CreateWalletRequest,
  CreateWalletResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  GetRecoveryPhraseRequest,
  GetRecoveryPhraseResponse,
} from './types';

/**
 * Makes a POST request to the create wallet endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param password - The user's password for wallet creation.
 * @returns A promise that resolves with the create wallet response (message and mnemonic).
 * @throws An ApiClientError if the request fails.
 */
export const createWallet = async (
  token: string | null,
  password: string
): Promise<CreateWalletResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  const payload: CreateWalletRequest = { password };
  return apiClient<CreateWalletResponse>({
    method: 'POST',
    endpoint: '/wallet/create',
    token,
    body: payload,
  });
};

/**
 * Makes a POST request to the sign transaction endpoint.
 * Requires authentication.
 * @param token - The authentication token.
 * @param password - The user's password for mnemonic decryption.
 * @param unsignedTransaction - The base64 encoded unsigned Solana transaction.
 * @returns A promise that resolves with the base64 encoded signed transaction.
 * @throws An ApiClientError if the request fails.
 */
export const signTransaction = async (
  token: string | null,
  password: string,
  unsignedTransaction: string
): Promise<SignTransactionResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  const payload: SignTransactionRequest = { password, unsignedTransaction };
  return apiClient<SignTransactionResponse>({
    method: 'POST',
    endpoint: '/wallet/sign-transaction', // Corrected endpoint to match main-api
    token,
    body: payload,
  });
};

/**
 * Fetches the user's decrypted recovery phrase from the backend.
 * Requires the user's password for decryption.
 * @param data - The request payload containing the password.
 * @param token - The authentication token.
 * @returns A promise that resolves with the recovery phrase or an error.
 * @throws An ApiClientError if the request fails.
 */
export const getRecoveryPhrase = async (
  data: GetRecoveryPhraseRequest,
  token: string | null
): Promise<GetRecoveryPhraseResponse> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<GetRecoveryPhraseResponse>({
    method: 'POST',
    endpoint: '/wallet/recovery-phrase',
    token,
    body: data,
  });
};
