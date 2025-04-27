import React, { useState, useContext, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text, Input } from '@repo/ui'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@/utils/formatters'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'
import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/api'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { useDrawerStore } from '@/store/drawerStore'
import { genericStyles } from '@/constants/GenericStyles'
import { checkPresaleCode, redeemPresaleCode } from '@/services/api'

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

  const walletAddress = user?.wallets && user.wallets.length > 0 ? user.wallets[0].address : 'No wallet linked'

  return (
    <ScreenLayout title='Settings' headerIcon={<Ionicons name='settings' size={24} color={Colors.tint} />}>
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
                  <Ionicons name='lock-closed-outline' size={22} color={Colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Change Password</Text>
                  <Text preset='caption'>Update your account password</Text>
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
                  <Ionicons name='help-circle-outline' size={22} color={Colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Help & Support</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='document-text-outline' size={22} color={Colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text preset='label'>Terms of Service</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name='document-text-outline' size={22} color={Colors.text} />
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
                    <Ionicons name='speedometer-outline' size={22} color={Colors.text} />
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
                    <Ionicons name='ticket-outline' size={22} color={Colors.text} />
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(155, 161, 166, 0.1)'
  },
  cardContent: {
    padding: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
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
    paddingHorizontal: 12
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(122, 142, 231, 0.1)',
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
    backgroundColor: Colors.background
  },
  inputContainer: {
    marginBottom: 20,
    gap: 8,
    width: '100%'
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10 // Add some space above the button
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
  }
})
