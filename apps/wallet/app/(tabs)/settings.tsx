import React from 'react'
import { StyleSheet, View, TouchableOpacity, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@team556/ui'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@/utils/formatters'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'
import { useAuthStore } from '@/store/authStore'
import { logoutUser, requestPasswordReset } from '@/services/api'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { useDrawerStore } from '@/store/drawerStore'
import { Alert } from 'react-native'

// Import moved drawer components
import ComingSoonDrawerContent from '@/components/drawers/account/ComingSoonDrawerContent'
import RedeemPresaleDrawerContent from '@/components/drawers/account/RedeemPresaleDrawerContent'
import ViewRecoveryPhraseDrawerContent from '@/components/drawers/account/ViewRecoveryPhraseDrawerContent'
import DeleteUserDrawerContent from '@/components/drawers/account/DeleteUserDrawerContent'

export default function SettingsScreen() {
  const router = useRouter()
  const { copyAddressToClipboard } = useWalletClipboard()
  const { logout: clearAuthStore, token, user } = useAuthStore()
  const { openDrawer, closeDrawer } = useDrawerStore()

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

  const handleCopyAddress = () => {
    if (user?.wallets && user.wallets.length > 0) {
      copyAddressToClipboard(user.wallets[0].address)
    }
  }

  const handleChangePasswordPress = () => {
    openDrawer(<ComingSoonDrawerContent onClose={closeDrawer} />)
  }

  const handleInitiatePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Could not find your email address.')
      return
    }
    try {
      // Consider adding a loading state if this takes time
      const response = await requestPasswordReset(user.email)
      Alert.alert('Check Your Email', response.message)
      router.push({ pathname: '/auth/ResetPasswordScreen', params: { email: user.email } })
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error.message || 'Failed to initiate password reset. Please try again.'
      Alert.alert('Error', errorMessage)
      console.error('Initiate Password Reset Error:', error.response?.data || error)
    }
  }

  const handleViewRecoveryPhrasePress = () => {
    openDrawer(<ViewRecoveryPhraseDrawerContent onClose={closeDrawer} />)
  }

  const handleOpenSheet = () => {
    openDrawer(<RedeemPresaleDrawerContent onClose={closeDrawer} />)
  }

  const handleOpenRedeemDashboard = () => {
    router.push('/redeem_dashboard')
  }

  const handleHelpPress = () => {
    openDrawer(<ComingSoonDrawerContent onClose={closeDrawer} />)
  }

  const handleDeleteUser = () => {
    openDrawer(<DeleteUserDrawerContent onClose={closeDrawer} />)
  }

  return (
    <ScreenLayout title='Settings' headerIcon={<Ionicons name='settings' size={24} color={Colors.primary} />}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text preset='h4'>Account</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text preset='label'>Email</Text>
              <Text preset='paragraph' color={Colors.icon}>
                {user?.email}
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
            <TouchableOpacity style={styles.menuItem} onPress={handleInitiatePasswordReset}>
              <View style={styles.menuItemIcon}>
                <Ionicons name='key-outline' size={22} color={Colors.primary} />
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

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text preset='h4'>Danger</Text>
          </View>

          <View style={styles.cardContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteUser}>
              <View style={styles.menuItemIcon}>
                <Ionicons name='ticket-outline' size={22} color={Colors.primary} />
              </View>
              <View style={styles.menuItemContent}>
                <Text preset='label' color={Colors.error}>Delete User</Text>
                <Text preset='caption'>Delete your account</Text>
              </View>
              <Ionicons name='chevron-forward' size={18} color={Colors.icon} />
            </TouchableOpacity>
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
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: Colors.background,
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
