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

// Define TokenOption type locally
type TokenOption = 'SOL' | 'TEAM'

const AssetDetailsDrawerContent: React.FC<{
  assetName: string
  balance: number | null
  ticker: string
  value: number | null
  IconComponent: React.FC<any>
  walletAddress: string | undefined
  onReceivePress: () => void
  onSendPress: () => void
  onSwapPress: () => void
  onClose: () => void
}> = ({
  assetName,
  balance,
  ticker,
  value,
  IconComponent,
  walletAddress,
  onReceivePress,
  onSendPress,
  onSwapPress,
  onClose
}) => {
  return (
    <View style={styles.drawerContentContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerIconContainer}>
          <IconComponent width={32} height={32} />
        </View>
        <Text preset='h4'>{assetName} Details</Text>
      </View>

      <View style={styles.drawerDetailRow}>
        <Text style={styles.drawerLabel}>Balance:</Text>
        <Text style={styles.drawerValue}>
          {formatBalance(balance)} {ticker}
        </Text>
      </View>

      <View style={styles.drawerDetailRow}>
        <Text style={styles.drawerLabel}>Value:</Text>
        <Text style={styles.drawerValue}>{formatPrice(value)}</Text>
      </View>

      {/* Drawer Actions */}
      <View style={styles.drawerActionsRow}>
        <View style={styles.actionButtonColumn}>
          <TouchableOpacity style={styles.circleButton} onPress={onReceivePress}>
            <Ionicons name='arrow-down' size={24} color='white' />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Receive</Text>
        </View>

        <View style={styles.actionButtonColumn}>
          <TouchableOpacity style={styles.circleButton} onPress={onSendPress}>
            <Ionicons name='arrow-up' size={24} color='white' />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Send</Text>
        </View>

        <View style={styles.actionButtonColumn}>
          <TouchableOpacity style={styles.circleButton} onPress={onSwapPress}>
            <Ionicons name='swap-horizontal' size={24} color='white' />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Swap</Text>
        </View>
      </View>

      <Button title='Close' onPress={onClose} variant='secondary' style={styles.drawerCloseButton} />
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

  const handleSendPress = (initialToken?: TokenOption) => {
    openDrawer(
      <SendDrawerContent
        solBalance={solBalance}
        teamBalance={teamBalance}
        fetchSolBalance={fetchSolBalance}
        fetchTeamBalance={fetchTeamBalance}
        initialSelectedToken={initialToken}
        onClose={closeDrawer}
      />
    )
  }

  const handleSwapPress = (initialToken?: TokenOption) => {
    openDrawer(
      <SwapDrawerContent
        solBalance={solBalance}
        teamBalance={teamBalance}
        fetchSolBalance={fetchSolBalance}
        fetchTeamBalance={fetchTeamBalance}
        initialInputToken={initialToken}
        onClose={closeDrawer}
      />
    )
  }

  const handleAssetPress = (
    assetName: string,
    balance: number | null,
    ticker: string,
    value: number | null,
    IconComponent: React.FC<any>
  ) => {
    const receivePressHandler = () => {
      if (walletAddress) {
        // Potentially close this drawer *before* opening the receive one?
        // closeDrawer(); // Optional: Close asset details before opening receive
        handleReceivePress() // Call the main handler
      } else {
        showToast('Wallet address not found.', 'error')
      }
    }

    const sendPressHandler = () => {
      // Potentially close this drawer before opening send?
      // closeDrawer();
      handleSendPress(ticker as TokenOption) // Call main handler with preselected token
    }

    const swapPressHandler = () => {
      // Potentially close this drawer before opening swap?
      // closeDrawer();
      handleSwapPress(ticker as TokenOption) // Call main handler with preselected token
    }

    openDrawer(
      <AssetDetailsDrawerContent
        assetName={assetName}
        balance={balance}
        ticker={ticker}
        value={value}
        IconComponent={IconComponent}
        walletAddress={walletAddress}
        onReceivePress={receivePressHandler}
        onSendPress={sendPressHandler}
        onSwapPress={swapPressHandler}
        onClose={closeDrawer}
      />
    )
  }

  const renderHeaderRight = () => {
    if (!walletAddress) return null
    return (
      <TouchableOpacity style={styles.addressContainer} onPress={handleCopyAddress}>
        <Text style={styles.addressText}>{formatWalletAddress(walletAddress)}</Text>
        <Ionicons name='copy-outline' size={16} color={Colors.primary} />
      </TouchableOpacity>
    )
  }

  return (
    <ScreenLayout
      title='Wallet'
      headerIcon={<Ionicons name='wallet' size={24} color={Colors.primary} />}
      headerRightElement={renderHeaderRight()}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Assets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
        </View>

        {/* SOL Token */}
        <TouchableOpacity
          style={styles.assetItem}
          onPress={() => handleAssetPress('Solana', solBalance, 'SOL', solValue, SolanaIcon)}
        >
          {/* Left side: Icon and Token Info */}
          <View style={styles.assetLeft}>
            <View style={styles.assetIconContainer}>
              <SolanaIcon width={24} height={24} />
            </View>
            <View>
              <Text style={styles.assetName}>Solana</Text>
              <View style={styles.tickerAndChange}>
                <Text style={styles.assetTicker}>SOL</Text>
              </View>
            </View>
          </View>

          {/* Right side: Balance Amount and Value */}
          <View style={styles.assetRight}>
            <Text style={styles.assetAmount}>{formatBalance(solBalance)} SOL</Text>
            <Text style={styles.assetValue}>{formatPrice(solValue)}</Text>
          </View>
        </TouchableOpacity>

        {/* TEAM Token */}
        <TouchableOpacity
          style={styles.assetItem}
          onPress={() => handleAssetPress('Team', teamBalance, 'TEAM', teamValue, TeamIcon)}
        >
          {/* Left side: Icon and Token Info */}
          <View style={styles.assetLeft}>
            <View style={styles.assetIconContainer}>
              <TeamIcon width={34} height={34} />
            </View>
            <View>
              <Text style={styles.assetName}>Team556</Text>
              <View style={styles.tickerAndChange}>
                <Text style={styles.assetTicker}>TEAM</Text>
              </View>
            </View>
          </View>

          {/* Right side: Balance Amount and Value */}
          <View style={styles.assetRight}>
            <Text style={styles.assetAmount}>{formatBalance(teamBalance)} TEAM</Text>
            <Text style={styles.assetValue}>{formatPrice(teamValue)}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyActivity}>
          {/* <Ionicons name='time-outline' size={24} color={Colors.textTertiary} />
          <Text style={styles.emptyActivityText}>No recent transactions</Text> */}
          <Text style={styles.emptyActivityText} preset='h4'>
            Coming Soon
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContentContainer: {
    paddingTop: 8 // Keep top padding within scroll content if needed
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8
  },
  addressText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  mainBalanceCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.backgroundDark, // Use defined card background
    marginBottom: 24
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    padding: 14,
    borderRadius: 12
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtleDark, // Use darker subtle primary for icon bg
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  actionText: {
    color: Colors.text,
    fontSize: 14
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    opacity: 0.7
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary // Use primary color for links
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.backgroundDark, // Use defined subtle card background
    borderWidth: 1,
    borderColor: Colors.backgroundSubtle,
    borderRadius: 12,
    marginBottom: 12
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  assetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  },
  assetTicker: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  tickerAndChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  assetPriceChange: {
    color: Colors.success, // Using the success color from Colors constants
    fontWeight: '600',
    fontSize: 14
  },
  assetRight: {
    alignItems: 'flex-end'
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  assetValue: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  emptyActivity: {
    height: 120,
    backgroundColor: Colors.backgroundDark, // Use defined subtle card background
    borderColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyActivityText: {
    color: Colors.textTertiary, // Use tertiary text color
    marginTop: 8
  },
  drawerContentContainer: {
    padding: 20,
    alignItems: 'stretch', // Stretch items for better row layout
    gap: 20 // Increased gap
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10 // Add space below header
  },
  drawerIconContainer: {
    width: 40, // Consistent sizing
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSubtle, // Use subtle background
    justifyContent: 'center',
    alignItems: 'center'
  },
  drawerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  drawerLabel: {
    fontSize: 16,
    color: Colors.textSecondary
  },
  drawerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  },
  drawerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Evenly distribute with space-between
    marginTop: 15,
    gap: 12 // Exactly 8px gap between buttons
  },
  drawerActionButton: {
    flex: 1 // Make buttons take equal space
  },
  drawerCloseButton: {
    marginTop: 16
  },
  actionButtonColumn: {
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    padding: 16,
    flex: 1, // Take 1/3 of available space (minus the gaps)
    maxWidth: '32%' // Ensure buttons don't get too wide
  },
  squareBackground: {
    width: 70,
    height: 70,
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.tint,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonLabel: {
    color: Colors.text,
    fontSize: 14
  }
})
