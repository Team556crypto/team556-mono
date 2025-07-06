// Explicitly import and re-export Firearm-related types from the shared UI package
export type { Firearm, CreateFirearmPayload, UpdateFirearmPayload } from '@team556/ui';

// Explicitly export other types from the local types.ts file
// This avoids exporting the conflicting local Firearm types
export type {
  Wallet,
  User,
  UserCredentials,
  LoginResponse,
  CreateWalletRequest,
  CreateWalletResponse,
  ApiErrorResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationResponse,
  CheckPresaleCodeResponse,
  RedeemPresaleCodeRequest,
  RedeemPresaleCodeResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  SendTransactionRequest,
  SendTransactionResponse,
  GetRecoveryPhraseRequest,
  GetRecoveryPhraseResponse,
  QuoteResponseV6,
  GetQuoteRequest,
  GetQuoteResponse,
  ExecuteSwapRequest,
  CreateTokenAccountsResponse,
  SubmitTokenAccountsRequest,
  SubmitTokenAccountsResponse,
  ExecuteSwapResponseWithStatus
} from './types';

// Export all functions from auth.ts
export * from './auth';

// Export all functions from user.ts
export * from './user';

// Export all functions from wallet.ts
export * from './wallet';

// Export all functions from presale.ts
export * from './presale';

// Export all functions from swap.ts
export * from './swap';

// Export all functions from firearm.ts
export * from './firearm';

// Export the ApiClientError and apiClient for direct use if needed
export { apiClient, ApiClientError } from './client';
