import { apiClient } from './client'

export type NotificationType = 'transaction' | 'alerts' | 'security' | 'marketing'

export interface NotificationSettingsResponse {
  email_enabled: boolean
  push_enabled: boolean
  types: NotificationType[]
  contact_email: string | null
  daily_summary_enabled: boolean
  transaction_alerts_enabled: boolean
  marketing_opt_in?: boolean
  email_verified: boolean
}

export interface UpdateNotificationSettingsRequest {
  email_enabled?: boolean
  push_enabled?: boolean
  types?: NotificationType[]
  contact_email?: string | null
  daily_summary_enabled?: boolean
  transaction_alerts_enabled?: boolean
  marketing_opt_in?: boolean
}

export const notificationsApi = {
  getSettings: (token: string | null) =>
    apiClient<NotificationSettingsResponse>({ method: 'GET', endpoint: '/notifications/settings', token }),

  updateSettings: (token: string | null, body: UpdateNotificationSettingsRequest) =>
    apiClient<{ message: string }>({ method: 'PATCH', endpoint: '/notifications/settings', token, body }),

  resendVerification: (token: string | null) =>
    apiClient<{ message: string }>({ method: 'POST', endpoint: '/notifications/resend-verification', token }),

  registerPushDevice: (token: string | null, deviceToken: string, platform: 'ios' | 'android' | 'web') =>
    apiClient<{ message: string }>({ method: 'POST', endpoint: '/notifications/push/devices', token, body: { token: deviceToken, platform } }),

  unregisterPushDevice: (token: string | null, deviceToken: string) =>
    apiClient<void>({ method: 'DELETE', endpoint: '/notifications/push/devices', token, body: { token: deviceToken } }),
}
