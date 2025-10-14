import { apiClient } from './client'
import type {
  POSWalletAddresses,
  UpdateWalletAddressResponse,
  ValidateAddressResponse,
  POSWalletHealthResponse,
} from './types'

const BASE = '/pos-wallet'

export const posWalletApi = {
  getWalletAddresses: (token: string | null) =>
    apiClient<POSWalletAddresses>({ method: 'GET', endpoint: `${BASE}/addresses`, token }),

  updatePrimaryAddress: (token: string | null, address: string) =>
    apiClient<UpdateWalletAddressResponse>({ method: 'PATCH', endpoint: `${BASE}/primary`, token, body: { address } }),

  updateSecondaryAddress: (token: string | null, address: string) =>
    apiClient<UpdateWalletAddressResponse>({ method: 'PATCH', endpoint: `${BASE}/secondary`, token, body: { address } }),

  validateAddress: (token: string | null, address: string) =>
    apiClient<ValidateAddressResponse>({ method: 'POST', endpoint: `${BASE}/validate`, token, body: { address } }),

  getWalletHealth: (token: string | null) =>
    apiClient<POSWalletHealthResponse>({ method: 'GET', endpoint: `${BASE}/health`, token }),
}
