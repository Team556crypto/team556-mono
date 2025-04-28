import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { Text, Button } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useWalletStore } from '@/store/walletStore'
import { Ionicons } from '@expo/vector-icons'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDrawerStore } from '@/store/drawerStore'
import SendDrawerContent from '@/components/SendDrawerContent'
import ReceiveDrawerContent from '@/components/ReceiveDrawerContent'
import SwapDrawerContent from '@/components/SwapDrawerContent'
import SolanaIcon from '@/assets/images/solana.svg'
import TeamIcon from '@/assets/images/team.svg'
import { formatWalletAddress, formatBalance, formatPrice } from '@/utils/formatters'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenLayout } from '@/components/ScreenLayout'

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

export default function HomeScreen() {
  const { user, token } = useAuthStore()
  const { showToast } = useToastStore()
  const { openDrawer, closeDrawer } = useDrawerStore()
  const insets = useSafeAreaInsets()

  // Use state and actions from the wallet store
  const {
    solBalance,
    solPrice,
    solError,
    fetchSolBalance,
    teamBalance,
    teamPrice,
    teamError,
    fetchTeamBalance,
    startPolling,
    stopPolling
  } = useWalletStore()

  const loadData = useCallback(async () => {
    if (token) {
      await Promise.all([fetchSolBalance(), fetchTeamBalance()])
    }
  }, [token, fetchSolBalance, fetchTeamBalance])

  // Start/Stop polling based on component mount/unmount and token presence
  useEffect(() => {
    if (token) {
      startPolling()
    } else {
      stopPolling() // Ensure polling is stopped if no token on mount
    }

    // Cleanup function to stop polling when the component unmounts
    return () => {
      stopPolling()
    }
  }, [token, startPolling, stopPolling]) // Re-run if token changes

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate SOL value
  const solValue = typeof solBalance === 'number' && typeof solPrice === 'number' ? solBalance * solPrice : null
  const teamValue = typeof teamBalance === 'number' && typeof teamPrice === 'number' ? teamBalance * teamPrice : null
  
  // Calculate total portfolio value
  const totalValue = (solValue || 0) + (teamValue || 0)

  useEffect(() => {
    if (solError) {
      showToast(`Error fetching SOL: ${solError}`, 'error')
    } else if (teamError) {
      showToast(`Error fetching TEAM: ${teamError}`, 'error')
    }
  }, [solError, teamError, showToast])

  // Assuming the first wallet is the primary one to display
  const walletAddress = user?.wallets?.[0]?.address
  const { copyAddressToClipboard } = useWalletClipboard()

  const handleCopyAddress = () => {
    copyAddressToClipboard(walletAddress)
    showToast('Address copied to clipboard', 'success')
  }

  const { isTabletOrLarger } = useBreakpoint()

  const handleReceivePress = () => {
    if (walletAddress) {
      openDrawer(<ReceiveDrawerContent address={walletAddress} onClose={closeDrawer} onDismiss={closeDrawer} />)
    } else {
      // Handle case where address is not available (shouldn't happen if user is logged in)
      showToast('Wallet address not found.', 'error')
    }
  }

  const handleSendPress = () => {
    openDrawer(
      <SendDrawerContent
        solBalance={solBalance}
        teamBalance={teamBalance}
        fetchSolBalance={fetchSolBalance}
        fetchTeamBalance={fetchTeamBalance}
        onClose={closeDrawer}
      />
    )
  }

  const handleSwapPress = () => {
    openDrawer(
      <SwapDrawerContent
        solBalance={solBalance}
        teamBalance={teamBalance}
        fetchSolBalance={fetchSolBalance}
        fetchTeamBalance={fetchTeamBalance}
        onClose={closeDrawer}
      />
    )
  }

  const renderHeaderRight = () => {
    if (!walletAddress) return null
    return (
      <TouchableOpacity style={styles.addressContainer} onPress={handleCopyAddress}>
        <Text style={styles.addressText}>{formatWalletAddress(walletAddress)}</Text>
        <Ionicons name="copy-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
    )
  }

  return (
    <ScreenLayout title="Wallet" headerRightElement={renderHeaderRight()}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Balance Card */}
        <View style={styles.mainBalanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{totalValue ? formatPrice(totalValue) : '--'}</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleReceivePress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-down-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSwapPress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="swap-horizontal-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Assets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
        </View>
        
        {/* SOL Token */}
        <TouchableOpacity style={styles.assetItem}>
          <View style={styles.assetLeft}>
            <View style={styles.assetIconContainer}>
              <SolanaIcon width={24} height={24} />
            </View>
            <View>
              <Text style={styles.assetName}>Solana</Text>
              <Text style={styles.assetTicker}>SOL</Text>
            </View>
          </View>
          
          <View style={styles.assetRight}>
            <Text style={styles.assetAmount}>{solBalance ? formatBalance(solBalance) : '--'} SOL</Text>
            <Text style={styles.assetValue}>${solValue ? formatPrice(solValue) : '--'}</Text>
          </View>
        </TouchableOpacity>
        
        {/* TEAM Token */}
        <TouchableOpacity style={styles.assetItem}>
          <View style={styles.assetLeft}>
            <View style={[styles.assetIconContainer, {backgroundColor: Colors.secondarySubtle}]}>
              <TeamIcon width={24} height={24} />
            </View>
            <View>
              <Text style={styles.assetName}>Team Token</Text>
              <Text style={styles.assetTicker}>TEAM</Text>
            </View>
          </View>
          
          <View style={styles.assetRight}>
            <Text style={styles.assetAmount}>{teamBalance ? formatBalance(teamBalance) : '--'} TEAM</Text>
            <Text style={styles.assetValue}>${teamValue ? formatPrice(teamValue) : '--'}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyActivity}>
          <Ionicons name="time-outline" size={24} color={Colors.textTertiary} />
          <Text style={styles.emptyActivityText}>No recent transactions</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContentContainer: {
    paddingTop: 8, // Keep top padding within scroll content if needed
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  addressText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mainBalanceCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground, // Use defined card background
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    padding: 14,
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtleDark, // Use darker subtle primary for icon bg
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: Colors.text,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary, // Use primary color for links
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackgroundSubtle, // Use defined subtle card background
    borderRadius: 12,
    marginBottom: 12,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySubtle, // Use subtle primary for icon bg
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  assetTicker: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  assetValue: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyActivity: {
    height: 120,
    backgroundColor: Colors.cardBackgroundSubtle, // Use defined subtle card background
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    color: Colors.textTertiary, // Use tertiary text color
    marginTop: 8,
  },
})
