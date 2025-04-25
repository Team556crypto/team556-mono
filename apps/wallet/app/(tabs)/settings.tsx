import React from 'react'
import { StyleSheet, View, TouchableOpacity, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@repo/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/api'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@/utils/formatters'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'

export default function SettingsScreen() {
  const router = useRouter()
  const { logout: clearAuthStore, token, user } = useAuthStore()
  const { copyAddressToClipboard } = useWalletClipboard()

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

  // Format wallet address to show first and last few characters
  const walletAddress = user?.wallets && user.wallets.length > 0 ? user.wallets[0].address : 'No wallet linked'

  const handleCopyAddress = () => {
    copyAddressToClipboard(walletAddress)
  }

  return (
    <ScreenLayout title='Settings' headerIcon={<Ionicons name='settings' size={24} color={Colors.tint} />}>
      {/* Profile Section */}
      {user ? (
        <View style={styles.container}>
          {/* Account Card */}
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

              <View style={styles.divider} />

              <Pressable style={styles.infoRow} onPress={handleCopyAddress}>
                <Text preset='label'>Wallet</Text>
                <View style={styles.walletContainer}>
                  <Text preset='paragraph' color={Colors.icon} selectable={true}>
                    {formatWalletAddress(walletAddress)}
                  </Text>
                  {walletAddress !== 'No wallet linked' && (
                    <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
                      <Ionicons name='copy-outline' size={16} color={Colors.tint} />
                    </TouchableOpacity>
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Security Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>Security</Text>
            </View>

            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.menuItem}>
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

          {/* About Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text preset='h4'>About</Text>
            </View>

            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.menuItem}>
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
  }
})
