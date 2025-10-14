import { apiClient } from './client'

// Types for security APIs
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface GenericMessageResponse {
  message: string
}

export interface MfaSetupResponse {
  enabled: boolean
  // When not enabled yet, backend can return otpauth_url and secret to enroll
  otpauth_url?: string
  secret?: string
}

export interface EnableMfaRequest {
  code: string // 6-digit TOTP code to confirm enrollment
}

export interface RecoveryCodesResponse {
  codes: string[] // Plain or masked depending on backend policy
}

export interface SessionInfo {
  id: string
  device: string
  ip_address?: string
  user_agent?: string
  last_active: string // ISO date
  created_at?: string // ISO date
  current: boolean
  location_hint?: string
}

export interface ListSessionsResponse {
  sessions: SessionInfo[]
}

// All functions accept token implicitly through headers
export const changePassword = async (token: string | null, body: ChangePasswordRequest) => {
  return apiClient<GenericMessageResponse>({ method: 'POST', endpoint: '/security/change-password', token, body })
}

export const getMfaSetup = async (token: string | null) => {
  return apiClient<MfaSetupResponse>({ method: 'GET', endpoint: '/security/mfa/setup', token })
}

export const enableMfa = async (token: string | null, body: EnableMfaRequest) => {
  return apiClient<GenericMessageResponse>({ method: 'POST', endpoint: '/security/mfa/enable', token, body })
}

export const disableMfa = async (token: string | null) => {
  return apiClient<GenericMessageResponse>({ method: 'POST', endpoint: '/security/mfa/disable', token })
}

export const getRecoveryCodes = async (token: string | null) => {
  return apiClient<RecoveryCodesResponse>({ method: 'GET', endpoint: '/security/recovery-codes', token })
}

export const regenerateRecoveryCodes = async (token: string | null) => {
  return apiClient<RecoveryCodesResponse>({ method: 'POST', endpoint: '/security/recovery-codes/regenerate', token })
}

export const listSessions = async (token: string | null) => {
  return apiClient<ListSessionsResponse>({ method: 'GET', endpoint: '/security/sessions', token })
}

export const revokeSession = async (token: string | null, sessionId: string) => {
  return apiClient<GenericMessageResponse>({ method: 'DELETE', endpoint: `/security/sessions/${sessionId}`, token })
}

export const revokeAllSessions = async (token: string | null) => {
  return apiClient<GenericMessageResponse>({ method: 'POST', endpoint: '/security/sessions/revoke-all', token })
}