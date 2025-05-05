import React, { useState, useContext, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text, Input } from '@repo/ui'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { formatWalletAddress } from '@/utils/formatters'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'
import { useAuthStore } from '@/store/authStore'
import {
  logoutUser,
  checkPresaleCode,
  redeemPresaleCode,
  getRecoveryPhrase,
  GetRecoveryPhraseRequest
} from '@/services/api'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { useDrawerStore } from '@/store/drawerStore'
import { genericStyles } from '@/constants/GenericStyles'

interface RedeemPresaleDrawerContentProps {
  onClose: () => void
}

const ComingSoonDrawerContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <View style={{ padding: 20, alignItems: 'center', gap: 15 }}>
      <Text preset='h4'>Feature Coming Soon!</Text>
      <Text preset='paragraph' style={{ textAlign: 'center' }}>
        The ability to change your password directly within the app is under development.
      </Text>
      <Button title='Close' onPress={onClose} variant='secondary' />
    </View>
  )
}

const RedeemPresaleDrawerContent: React.FC<RedeemPresaleDrawerContentProps> = ({ onClose }) => {
  const { token, fetchAndUpdateUser } = useAuthStore()
  const [presaleCode, setPresaleCode] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [codeType, setCodeType] = useState<number | null>(null)
  const [isWalletInputVisible, setIsWalletInputVisible] = useState(false)
  const [canRedeem, setCanRedeem] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)

  const handleCheckCode = useCallback(async () => {
    if (!presaleCode) {
      setMessage('Please enter a presale code.')
      setMessageType('error')
      return
    }

    setIsChecking(true)
    setMessage(null)
    setMessageType(null)
    setCanRedeem(false)
    setIsWalletInputVisible(false)
    setCodeType(null)

    const response = await checkPresaleCode(presaleCode.toUpperCase(), token)

    if (response.isValid && !response.redeemed) {
      setMessage(response.message)
      setMessageType('success')
      setCanRedeem(true)
      setCodeType(response.type ?? null)
      if (response.type === 2) {
        setIsWalletInputVisible(true)
      }
    } else {
      setMessage(response.message)
      setMessageType('error')
      setCanRedeem(false)
    }

    setIsChecking(false)
  }, [presaleCode, token])

  const handleRedeemCode = useCallback(async () => {
    if (!presaleCode || !canRedeem) return

    if (codeType === 2 && !walletAddress) {
      setMessage('Please enter the wallet address for this code type.')
      setMessageType('error')
      return
    }

    setIsRedeeming(true)
    setMessage(null)
    setMessageType(null)

    const response = await redeemPresaleCode(
      {
        code: presaleCode.toUpperCase(),
        walletAddress: codeType === 2 ? walletAddress : undefined
      },
      token
    )

    if (response.success) {
      setMessage(response.message)
      await fetchAndUpdateUser()
      setMessageType('success')
      setCanRedeem(false) // Disable further attempts in the drawer
      // Fetch the updated user profile to reflect the change immediately
      setTimeout(() => {
        onClose()
        // Optionally reset all state fields here if needed upon re-opening
        setPresaleCode('')
        setWalletAddress('')
        setCodeType(null)
        setIsWalletInputVisible(false)
        setCanRedeem(false)
        setMessage(null)
        setMessageType(null)
      }, 1500)
    } else {
      setMessage(response.message)
      setMessageType('error')
    }

    setIsRedeeming(false)
  }, [presaleCode, walletAddress, canRedeem, codeType, token, fetchAndUpdateUser, onClose])

  return (
    <View style={styles.sheetContentContainer}>
      <Text preset='h4' style={styles.sheetTitle}>
        Redeem Presale Code
      </Text>
      <View style={styles.inputContainer}>
        <Input
          placeholder='Enter your presale code'
          value={presaleCode}
          onChangeText={setPresaleCode}
          autoCapitalize='characters'
          style={[genericStyles.input, styles.input]}
          leftIcon={<Ionicons name='ticket-outline' size={20} color={Colors.icon} />}
        />
      </View>
      {isWalletInputVisible && (
        <View style={styles.inputContainer}>
          <Text preset='label'>Redeem to wallet</Text>
          <Input
            placeholder='Redeem Wallet'
            value={walletAddress}
            onChangeText={setWalletAddress}
            style={[genericStyles.input, styles.input]}
            leftIcon={<Ionicons name='wallet-outline' size={20} color={Colors.icon} />}
            editable={!isRedeeming} // Disable if redeeming
          />
        </View>
      )}
      {message && (
        <Text style={[styles.messageText, messageType === 'success' ? styles.successText : styles.errorText]}>
          {message}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        {canRedeem ? (
          <Button
            title='Redeem Code'
            onPress={handleRedeemCode}
            fullWidth
            disabled={isRedeeming || isChecking}
            loading={isRedeeming}
          />
        ) : (
          <Button
            title='Check Code'
            onPress={handleCheckCode}
            fullWidth
            disabled={isChecking || isRedeeming}
            loading={isChecking}
          />
        )}
      </View>
    </View>
  )
}

// --- View Recovery Phrase Drawer ---
interface ViewRecoveryPhraseDrawerContentProps {
  onClose: () => void
}

const ViewRecoveryPhraseDrawerContent: React.FC<ViewRecoveryPhraseDrawerContentProps> = ({ onClose }) => {
  const { token } = useAuthStore()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedPhrase, setRevealedPhrase] = useState<string | null>(null)
  const [isPhraseVisible, setIsPhraseVisible] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const resetState = useCallback(() => {
    setPassword('')
    setIsLoading(false)
    setError(null)
    setRevealedPhrase(null)
    setIsPhraseVisible(false)
    setCopySuccess(false)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleViewPhrase = useCallback(async () => {
    if (!password) {
      setError('Password is required.')
      return
    }

    setIsLoading(true)
    setError(null)
    setRevealedPhrase(null)
    setIsPhraseVisible(false)
    setCopySuccess(false)

    const response = await getRecoveryPhrase({ password }, token)

    if (response.error) {
      setError(response.error) // Use error message from API response
      setPassword('') // Clear password on error
    } else if (response.recoveryPhrase) {
      setRevealedPhrase(response.recoveryPhrase)
      setIsPhraseVisible(true)
      setPassword('') // Clear password on success
    } else {
      // Handle unexpected case where there's no error but no phrase either
      setError('Failed to retrieve recovery phrase. Please try again.')
      setPassword('')
    }

    setIsLoading(false)
  }, [password, token])

  const handleCopyPhrase = useCallback(async () => {
    if (revealedPhrase) {
      await Clipboard.setStringAsync(revealedPhrase)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000) // Reset message after 2 seconds
    }
  }, [revealedPhrase])

  const handleHidePhrase = useCallback(() => {
    setIsPhraseVisible(false)
    // Optionally clear revealedPhrase here if you want password re-entry to see it again
    // setRevealedPhrase(null);
  }, [])

  // Split phrase into words for grid display
  const phraseWords = revealedPhrase?.split(' ') || []

  return (
    <View style={styles.sheetContentContainer}>
      <Text preset='h4' style={styles.sheetTitle}>
        View Recovery Phrase
      </Text>

      {revealedPhrase && isPhraseVisible ? (
        // Display Phrase Section
        <View style={styles.phraseContainer}>
          <Text preset='paragraph' style={styles.warningText}>
            Do not share this phrase with anyone! Store it securely.
          </Text>
          <View style={styles.phraseGrid}>
            {phraseWords.map((word, index) => (
              <View key={index} style={styles.wordBox}>
                <Text style={styles.wordNumber}>{`${index + 1}.`}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>
          <View style={styles.buttonContainerHorizontal}>
            <Button
              title={copySuccess ? 'Copied!' : 'Copy Phrase'}
              onPress={handleCopyPhrase}
              variant='secondary'
              leftIcon={
                <Ionicons
                  name={copySuccess ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color={Colors.textSecondary}
                />
              }
              style={styles.flexButton}
            />
            <Button
              title='Hide'
              onPress={handleHidePhrase}
              variant='secondary'
              leftIcon={<Ionicons name='eye-off-outline' size={18} color={Colors.textSecondary} />}
              style={styles.flexButton}
            />
          </View>
        </View>
      ) : (
        // Password Input Section
        <View style={styles.inputContainer}>
          <Text preset='paragraph' style={styles.infoText}>
            Enter your password to view your recovery phrase.
          </Text>
          <View style={[styles.inputContainer]}>
            <Input
              placeholder='Enter your password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[genericStyles.input, styles.input]}
              leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
              editable={!isLoading}
            />
          </View>
          {error && <Text style={[styles.messageText, styles.errorText]}>{error}</Text>}
          <View style={styles.buttonContainer}>
            <Button
              title='View Phrase'
              onPress={handleViewPhrase}
              fullWidth
              disabled={isLoading || !password}
              loading={isLoading}
            />
          </View>
        </View>
      )}

      <View style={[styles.buttonContainer, { marginTop: 40 }]}>
        <Button title='Close' onPress={handleClose} fullWidth variant='secondary' />
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { copyAddressToClipboard } = useWalletClipboard()
  const { logout: clearAuthStore, token, user, fetchAndUpdateUser } = useAuthStore()
  const { openDrawer, closeDrawer } = useDrawerStore()

  const handleOpenRedeemDashboard = () => {
    router.push('/redeem_dashboard')
  }

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutUser(token)
      } else {
        console.warn('No token found, proceeding with client-side logout only.')
      }
    } catch (error) {
      console.error('Failed to logout on server:', error)
    } finally {
      clearAuthStore()
      router.replace('/login')
    }
  }

  const handleOpenSheet = () => {
    openDrawer(<RedeemPresaleDrawerContent onClose={closeDrawer} />)
  }

  const handleCopyAddress = () => {
    if (user?.wallets && user.wallets.length > 0) {
      copyAddressToClipboard(user.wallets[0].address)
    }
  }

  const handleChangePasswordPress = () => {
    openDrawer(<ComingSoonDrawerContent onClose={closeDrawer} />)
  }

  const handleHelpPress = () => {
    openDrawer(<ComingSoonDrawerContent onClose={closeDrawer} />)
  }

  const handleViewRecoveryPhrasePress = () => {
    openDrawer(<ViewRecoveryPhraseDrawerContent onClose={closeDrawer} />)
  }

  return (
    <ScreenLayout title='Settings' headerIcon={<Ionicons name='settings' size={24} color={Colors.primary} />}>
      {user ? (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>Account</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text preset='label'>Email</Text>
                <Text preset='paragraph' color={Colors.icon}>
                  {user.email}
                </Text>
              </View>

              {user?.wallets && user.wallets.length > 0 ? (
                <>
                  <View style={styles.divider} />
                  <Pressable style={styles.infoRow} onPress={handleCopyAddress}>
                    <Text preset='label'>Wallet</Text>
                    <View style={styles.walletContainer}>
                      <Text preset='paragraph' color={Colors.icon} selectable={true}>
                        {formatWalletAddress(user.wallets[0].address)}
                      </Text>
                      <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
                        <Ionicons name='copy-outline' size={16} color={Colors.tint} />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </>
              ) : (
                <View style={styles.infoRow}>
                  <Text preset='label'>Wallet</Text>
                  <Text preset='paragraph' color={Colors.icon}>
                    No wallet linked
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>Security</Text>
            </View>

            <View style={styles.cardContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleChangePasswordPress} // <--- ADD THIS onPress PROP
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name='lock-closed-outline' size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Change Password</Text>
                  <Text preset='caption'>Update your account password</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleViewRecoveryPhrasePress}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='shield-checkmark-outline' size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>View Recovery Phrase</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>About</Text>
            </View>

            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.menuItem} onPress={handleHelpPress}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='help-circle-outline' size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Help & Support</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='document-text-outline' size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Terms of Service</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='document-text-outline' size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Privacy Policy</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.versionContainer}>
                <Text preset='caption' color={Colors.icon}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>Redeem</Text>
            </View>

            <View style={styles.cardContent}>
              {user?.has_redeemed_presale ? (
                <TouchableOpacity style={styles.menuItem} onPress={handleOpenRedeemDashboard}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name='speedometer-outline' size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text preset='label'>Presale Dashboard</Text>
                    <Text preset='caption'>Your presale redeem dashboard</Text>
                  </View>
                  <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.menuItem} onPress={handleOpenSheet}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name='ticket-outline' size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text preset='label'>Redeem Presale</Text>
                    <Text preset='caption'>Redeem presale with code</Text>
                  </View>
                  <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.logoutButtonContainer}>
            <Button
              title='Logout'
              onPress={handleLogout}
              variant='danger'
              fullWidth
              leftIcon={<Ionicons name='log-out-outline' size={20} color='#fff' />}
            />
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text preset='paragraph'>Loading profile...</Text>
        </View>
      )}
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 0
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%'
  },
  copyButton: {
    marginLeft: 8,
    padding: 4
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(155, 161, 166, 0.1)',
    marginHorizontal: 12
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  menuItemContent: {
    flex: 1
  },
  versionContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  logoutButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
    paddingBottom: 20
  },
  sheetContentContainer: {
    padding: 20,
    alignItems: 'center'
  },
  sheetTitle: {
    marginBottom: 20
  },
  input: {
    backgroundColor: Colors.background,
    width: '100%'
  },
  inputContainer: {
    gap: 8,
    width: '100%'
  },
  buttonContainer: {
    width: '100%'
  },
  messageText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14
  },
  successText: {
    color: Colors.success
  },
  errorText: {
    color: Colors.error
  },
  phraseContainer: {
    padding: 20,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: 20
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10
  },
  wordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '48%',
    marginBottom: 10
  },
  wordNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
    fontWeight: '600'
  },
  wordText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500'
  },
  buttonContainerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 10
  },
  flexButton: {
    flex: 1
  },
  warningText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
  },
  infoText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15
  }
})
