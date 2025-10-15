import { apiClient } from './client'

// Referral API Types
export interface ReferralCode {
  referral_code: string
  generated_at: string
  share_url: string
  message: string
}

export interface ReferralStats {
  user_id: number
  referral_code: string | null
  total_referrals: number
  wallet_created_referrals: number
  team556_holding_referrals: number
  conversion_rate_to_wallet: number
  conversion_rate_to_team556: number
  total_team556_volume: number
  average_team556_balance: number
  first_referral_at: string | null
  most_recent_referral_at: string | null
  last_calculated_at: string
}

export interface ReferralHistoryItem {
  id: number
  referred_user_code: string
  signup_date: string
  wallet_created: boolean
  wallet_created_at: string | null
  has_team556: boolean
  team556_balance: number
  first_team556_detected_at: string | null
  conversion_source: string | null
}

export interface ReferralHistory {
  referrals: ReferralHistoryItem[]
  total: number
  page: number
  page_size: number
}

export interface ValidateReferralCodeResponse {
  valid: boolean
  referrer_name?: string
  message: string
}

// Referral API Functions

/**
 * Generate or get existing referral code for the authenticated user
 */
export const generateReferralCode = async (token: string): Promise<ReferralCode> => {
  return apiClient<ReferralCode>({
    method: 'GET',
    endpoint: '/referrals/code',
    token
  })
}

/**
 * Regenerate a new referral code (invalidates the old one)
 */
export const regenerateReferralCode = async (token: string): Promise<ReferralCode> => {
  return apiClient<ReferralCode>({
    method: 'POST',
    endpoint: '/referrals/code/regenerate',
    token
  })
}

/**
 * Get referral statistics for the authenticated user
 */
export const getReferralStats = async (token: string): Promise<ReferralStats> => {
  return apiClient<ReferralStats>({
    method: 'GET',
    endpoint: '/referrals/stats',
    token
  })
}

/**
 * Get paginated referral history
 */
export const getReferralHistory = async (
  token: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ReferralHistory> => {
  return apiClient<ReferralHistory>({
    method: 'GET',
    endpoint: '/referrals/history',
    token,
    params: {
      page,
      page_size: pageSize
    }
  })
}

/**
 * Validate a referral code (public endpoint)
 */
export const validateReferralCode = async (referralCode: string): Promise<ValidateReferralCodeResponse> => {
  return apiClient<ValidateReferralCodeResponse>({
    method: 'POST',
    endpoint: '/referrals/validate',
    body: {
      referral_code: referralCode
    }
  })
}