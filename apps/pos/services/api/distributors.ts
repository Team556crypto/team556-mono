import { apiClient } from './client'

export interface DistributorInfo {
  code: string
  name: string
  docs_url: string
  auth_type: string
  fields: string[]
}

export interface DistributorListResponse { distributors: DistributorInfo[] }

export interface DistributorConnectionOut {
  id: number
  distributor_code: string
  status: string
  last_sync_at?: string | null
  updated_at: string
  created_at: string
}

export interface DistributorConnectionsResponse { connections: DistributorConnectionOut[] }

export interface PricingSettings {
  margin_percent?: number
  min_margin_percent?: number
  fixed_markup_cents?: number
  rounding?: 'none' | 'nearest' | 'up'
  price_floor_cents?: number
  shipping_handling_cents?: number
  map_enforced?: boolean
  auto_import_new?: boolean
  auto_update_existing?: boolean
}

export interface DistributorSettings {
  pricing: PricingSettings
}

export const distributorsApi = {
  listSupported: (token: string | null) =>
    apiClient<DistributorListResponse>({ method: 'GET', endpoint: '/distributors/', token }),

  listConnections: (token: string | null) =>
    apiClient<DistributorConnectionsResponse>({ method: 'GET', endpoint: '/distributor-connections/', token }),

  upsertConnection: (
    token: string | null,
    distributor_code: string,
    credentials: Record<string, string>
  ) =>
    apiClient<{ message: string; valid: boolean; error?: string }>({
      method: 'POST',
      endpoint: '/distributor-connections/',
      token,
      body: { distributor_code, credentials },
    }),

  validateConnection: (token: string | null, code: string) =>
    apiClient<{ valid: boolean; error?: string }>({
      method: 'POST',
      endpoint: `/distributor-connections/${code}/validate`,
      token,
    }),

  getSettings: (token: string | null, code: string) =>
    apiClient<DistributorSettings>({
      method: 'GET',
      endpoint: `/distributor-connections/${code}/settings`,
      token,
    }),

  updateSettings: (token: string | null, code: string, settings: DistributorSettings) =>
    apiClient<{ message: string }>({
      method: 'PATCH',
      endpoint: `/distributor-connections/${code}/settings`,
      token,
      body: settings,
    }),

  deleteConnection: (token: string | null, code: string) =>
    apiClient<void>({ method: 'DELETE', endpoint: `/distributor-connections/${code}`, token }),

  syncConnection: (token: string | null, code: string) =>
    apiClient<{ message: string }>({ method: 'POST', endpoint: `/distributor-connections/${code}/sync`, token }),
}
