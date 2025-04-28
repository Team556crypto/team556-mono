import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity, Platform, ImageBackground, ScrollView, StatusBar } from 'react-native'
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
import { LinearGradient } from 'expo-linear-gradient'
import SolanaIcon from '@/assets/images/solana.svg'
import TeamIcon from '@/assets/images/team.svg'
import { formatWalletAddress, formatBalance, formatPrice } from '@/utils/formatters'

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

  return (
    <View style={styles.container}>
      {/* Status Bar with gradient */}
      <StatusBar barStyle="light-content" />
      
      {/* Top Gradient Header */}
      <LinearGradient
        colors={['#9945FF', '#14F195']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header with Wallet Address */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="wallet-outline" size={26} color="#9945FF" />
            <Text preset="h3" style={styles.headerTitle}>Wallet</Text>
          </View>
          
          {walletAddress && (
            <TouchableOpacity style={styles.addressContainer} onPress={handleCopyAddress}>
              <Text style={styles.addressText}>{formatWalletAddress(walletAddress)}</Text>
              <Ionicons name="copy-outline" size={16} color="#9945FF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Main Balance Card */}
        <LinearGradient
          colors={['rgba(153, 69, 255, 0.1)', 'rgba(20, 241, 149, 0.05)']}
          style={styles.mainBalanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalValue ? formatPrice(totalValue) : '--'}</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleReceivePress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-down-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSwapPress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
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
            <View style={[styles.assetIconContainer, {backgroundColor: 'rgba(20, 241, 149, 0.1)'}]}>
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
          <Ionicons name="time-outline" size={24} color="#657786" />
          <Text style={styles.emptyActivityText}>No recent transactions</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F12',
  },
  headerGradient: {
    height: 3,
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  addressText: {
    color: '#A5ADBA',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mainBalanceCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 25, 30, 0.8)',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#A5ADBA',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#9945FF',
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(22, 25, 30, 0.5)',
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
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assetTicker: {
    fontSize: 12,
    color: '#A5ADBA',
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  assetValue: {
    fontSize: 12,
    color: '#A5ADBA',
  },
  emptyActivity: {
    height: 120,
    backgroundColor: 'rgba(22, 25, 30, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    color: '#657786',
    marginTop: 8,
  },
})
