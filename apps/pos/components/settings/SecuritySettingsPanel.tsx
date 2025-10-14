import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Alert, FlatList, Platform } from 'react-native'
import { Button, Input, Text, useTheme } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import {
  changePassword,
  getMfaSetup,
  enableMfa,
  disableMfa,
  getRecoveryCodes,
  regenerateRecoveryCodes,
  listSessions,
  revokeSession,
  revokeAllSessions,
  type SessionInfo,
} from '@/services/api/security'

export const SecuritySettingsPanel = () => {
  const { colors } = useTheme()
  const { token, logout } = useAuthStore()

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false)
  const [otpauthUrl, setOtpauthUrl] = useState<string | undefined>()
  const [mfaSecret, setMfaSecret] = useState<string | undefined>()
  const [mfaCode, setMfaCode] = useState('')
  const [loadingMfa, setLoadingMfa] = useState(true)
  const [togglingMfa, setTogglingMfa] = useState(false)

  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [loadingCodes, setLoadingCodes] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    // Load MFA status/setup
    ;(async () => {
      try {
        setLoadingMfa(true)
        const res = await getMfaSetup(token)
        setMfaEnabled(res.enabled)
        setOtpauthUrl(res.otpauth_url)
        setMfaSecret(res.secret)
      } catch (e) {
        // Non-fatal; show banner optionally
        console.warn('Failed to load MFA setup', e)
      } finally {
        setLoadingMfa(false)
      }
    })()
  }, [token])

  useEffect(() => {
    // Load sessions
    ;(async () => {
      try {
        setLoadingSessions(true)
        const res = await listSessions(token)
        setSessions(res.sessions || [])
      } catch (e) {
        console.warn('Failed to load sessions', e)
      } finally {
        setLoadingSessions(false)
      }
    })()
  }, [token])

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Invalid Password', 'New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.')
      return
    }
    try {
      setChanging(true)
      await changePassword(token, { current_password: currentPassword, new_password: newPassword })
      Alert.alert('Success', 'Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      Alert.alert('Error', e?.errorData?.error || 'Failed to change password')
    } finally {
      setChanging(false)
    }
  }

  const handleEnableMfa = async () => {
    if (!mfaCode || mfaCode.length < 6) {
      Alert.alert('Invalid Code', 'Enter the 6-digit code from your authenticator app.')
      return
    }
    try {
      setTogglingMfa(true)
      await enableMfa(token, { code: mfaCode })
      setMfaEnabled(true)
      setMfaCode('')
      // Load codes after enabling
      await loadRecoveryCodes()
      Alert.alert('Two-Factor Enabled', 'Keep your recovery codes in a safe place.')
    } catch (e: any) {
      Alert.alert('Error', e?.errorData?.error || 'Failed to enable 2FA')
    } finally {
      setTogglingMfa(false)
    }
  }

  const handleDisableMfa = async () => {
    Alert.alert('Disable 2FA?', 'This will remove authenticator protection from your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable', style: 'destructive', onPress: async () => {
          try {
            setTogglingMfa(true)
            await disableMfa(token)
            setMfaEnabled(false)
            setRecoveryCodes(null)
            setOtpauthUrl(undefined)
            setMfaSecret(undefined)
            Alert.alert('Two-Factor Disabled', 'You can re-enable it anytime.')
          } catch (e: any) {
            Alert.alert('Error', e?.errorData?.error || 'Failed to disable 2FA')
          } finally {
            setTogglingMfa(false)
          }
        }
      }
    ])
  }

  const loadRecoveryCodes = async () => {
    try {
      setLoadingCodes(true)
      const res = await getRecoveryCodes(token)
      setRecoveryCodes(res.codes || [])
    } catch (e) {
      console.warn('Failed to load recovery codes')
    } finally {
      setLoadingCodes(false)
    }
  }

  const handleRegenerateCodes = async () => {
    Alert.alert('Regenerate Codes?', 'Old recovery codes will no longer work.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate', style: 'destructive', onPress: async () => {
          try {
            setLoadingCodes(true)
            const res = await regenerateRecoveryCodes(token)
            setRecoveryCodes(res.codes || [])
            Alert.alert('New Recovery Codes Generated', 'Store them securely. This is the only time they are fully shown.')
          } catch (e: any) {
            Alert.alert('Error', e?.errorData?.error || 'Failed to regenerate recovery codes')
          } finally {
            setLoadingCodes(false)
          }
        }
      }
    ])
  }

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession(token, id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      Alert.alert('Error', e?.errorData?.error || 'Failed to revoke session')
    }
  }

  const handleRevokeAll = async () => {
    Alert.alert('Sign out everywhere?', 'This will revoke all sessions except possibly this one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out all', style: 'destructive', onPress: async () => {
          try {
            await revokeAllSessions(token)
            // Also log out locally
            await logout()
          } catch (e: any) {
            Alert.alert('Error', e?.errorData?.error || 'Failed to revoke all sessions')
          }
        }
      }
    ])
  }

  const MfaSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name='shield-checkmark' size={18} color={Colors.primary} />
        <Text style={styles.cardTitle}>Two-Factor Authentication (TOTP)</Text>
      </View>
      {loadingMfa ? (
        <Text style={{ color: Colors.textSecondary }}>Loading 2FA status…</Text>
      ) : mfaEnabled ? (
        <>
          <Text style={styles.cardText}>Authenticator is enabled for your account.</Text>
          <View style={styles.row}>
            <Button title='Disable 2FA' variant='outline' onPress={handleDisableMfa} loading={togglingMfa} />
            <Button title='Show Recovery Codes' onPress={loadRecoveryCodes} />
          </View>
          {recoveryCodes && (
            <View style={styles.recoveryBlock}>
              <Text style={styles.recoveryTitle}>Recovery Codes</Text>
              {recoveryCodes.map((c, i) => (
                <Text key={i} style={styles.codeMono}>{c}</Text>
              ))}
              <View style={styles.row}>
                <Button title='Regenerate Codes' variant='outline' onPress={handleRegenerateCodes} loading={loadingCodes} />
              </View>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.cardText}>Scan the QR with Google Authenticator, 1Password, or Authy, then enter the 6‑digit code to enable 2FA.</Text>
          <View style={styles.qrRow}>
            {otpauthUrl ? (
              <View style={styles.qrContainer}>
                <QRCode value={otpauthUrl} size={160} backgroundColor='transparent' color={colors.text} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ color: Colors.textSecondary }}>Waiting for enrollment details…</Text>
                <Button title='Get QR' variant='outline' onPress={async () => {
                  try { const res = await getMfaSetup(token); setOtpauthUrl(res.otpauth_url); setMfaSecret(res.secret); } catch (e) { /* no-op */ }
                }} />
              </View>
            )}
            {mfaSecret ? (
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.monoLabel}>Secret</Text>
                <Text style={styles.codeMono}>{mfaSecret}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder='123 456'
                keyboardType='number-pad'
                value={mfaCode}
                onChangeText={setMfaCode}
                style={{ backgroundColor: Colors.backgroundLight }}
              />
            </View>
            <View style={{ flexShrink: 0 }}>
              <Button title='Enable 2FA' onPress={handleEnableMfa} loading={togglingMfa} disabled={!otpauthUrl} />
            </View>
          </View>
        </>
      )}
    </View>
  )

  const ChangePasswordSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name='key' size={18} color={Colors.primary} />
        <Text style={styles.cardTitle}>Change Password</Text>
      </View>
      <Input
        placeholder='Current password'
        isPassword
        value={currentPassword}
        onChangeText={setCurrentPassword}
        style={{ backgroundColor: Colors.backgroundLight }}
      />
      <Input
        placeholder='New password'
        isPassword
        value={newPassword}
        onChangeText={setNewPassword}
        style={{ backgroundColor: Colors.backgroundLight }}
      />
      <Input
        placeholder='Confirm new password'
        isPassword
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{ backgroundColor: Colors.backgroundLight }}
      />
      <View style={styles.row}>
        <Button title='Update Password' onPress={handleChangePassword} loading={changing} />
      </View>
    </View>
  )

  const SessionsSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name='devices' size={18} color={Colors.primary} />
        <Text style={styles.cardTitle}>Active Sessions</Text>
      </View>
      {loadingSessions ? (
        <Text style={{ color: Colors.textSecondary }}>Loading sessions…</Text>
      ) : (
        <>
          {sessions.length === 0 ? (
            <Text style={{ color: Colors.textSecondary }}>No other active sessions.</Text>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <View style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{item.device || item.user_agent || 'Unknown device'}</Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                      {item.ip_address ? `${item.ip_address} • ` : ''}{new Date(item.last_active).toLocaleString()}
                    </Text>
                    {item.current && (
                      <Text style={{ color: Colors.success, fontSize: 12, marginTop: 2 }}>This device</Text>
                    )}
                  </View>
                  {!item.current && (
                    <Button title='Revoke' variant='outline' onPress={() => handleRevokeSession(item.id)} />
                  )}
                </View>
              )}
            />
          )}
          <View style={styles.row}>
            <Button title='Sign out of all sessions' variant='danger' onPress={handleRevokeAll} />
          </View>
        </>
      )}
    </View>
  )

  return (
    <View style={styles.wrapper}>
      <ChangePasswordSection />
      <MfaSection />
      <SessionsSection />
      <View style={[styles.card, { alignItems: 'center' }]}>
        <Text preset='caption' style={{ color: Colors.textSecondary }}>
          Keep your account secure. Enable 2FA and review active sessions regularly.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 24,
    gap: 16
  },
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  },
  cardText: {
    color: Colors.textSecondary,
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12
  },
  qrContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  monoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4
  },
  codeMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text,
    fontSize: 14
  },
  recoveryBlock: {
    marginTop: 12,
    gap: 4
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12
  }
})