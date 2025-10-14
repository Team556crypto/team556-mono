import type {
  POSWalletAddresses as ApiPOSWalletAddresses,
  ValidateAddressResponse as ApiValidateAddressResponse,
  POSWalletHealthResponse as ApiPOSWalletHealthResponse,
} from '@/services/api'

// UI-facing aliases for POS wallet types
export type POSWalletAddresses = ApiPOSWalletAddresses

export interface WalletAddressValidation {
  is_valid: boolean
  message: string
}

export type POSWalletHealth = ApiPOSWalletHealthResponse
