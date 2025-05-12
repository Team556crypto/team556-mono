import React, { useEffect, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useWalletStore } from '@/store/walletStore'
import { Ionicons } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDrawerStore } from '@/store/drawerStore'
import SendDrawerContent from '@/components/drawers/SendDrawerContent'
import ReceiveDrawerContent from '@/components/drawers/ReceiveDrawerContent'
import SwapDrawerContent from '@/components/drawers/SwapDrawerContent'
import SolanaIcon from '@/assets/images/solana.svg'
import TeamIcon from '@/assets/images/team.svg'
import { formatWalletAddress, formatPrice } from '@/utils/formatters'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import AssetDetailsDrawerContent from '@/components/drawers/AssetDetailsDrawerContent'
import AssetCard from '@/components/assets/AssetCard'

// Define TokenOption type locally
type TokenOption = 'SOL' | 'TEAM'

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
  const totalPortfolioValue = (solValue || 0) + (teamValue || 0)

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
    price: number | null,
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
        price={price}
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

  // --- BEGIN: Added User Info and Portfolio Data Logic ---
  const userEmail = user?.email || 'bobjoe@example.com' // Fallback for display
  const userNamePart = userEmail.split('@')[0]
  const userInitial = (userNamePart.charAt(0) || '').toUpperCase()
  const displayName = `${userNamePart}'s Wallet`

  // Placeholder for daily change data - replace with actual data when available
  const dailyChangeValue = 2.4
  const dailyChangePositive = dailyChangeValue >= 0
  const dailyChangeText = `${dailyChangePositive ? '+' : ''}${dailyChangeValue}% today`
  // --- END: Added User Info and Portfolio Data Logic ---

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
      >
        {/* --- BEGIN: New Portfolio Section --- */}
        <View style={styles.portfolioSectionContainer}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
            <Text style={styles.userNameText}>{displayName}</Text>
          </View>

          <View style={styles.portfolioDetailsContainer}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValueText}>{formatPrice(totalPortfolioValue)}</Text>
            {/* <View style={styles.dailyChangeContainer}>
              <Feather
                name={dailyChangePositive ? 'arrow-up-right' : 'arrow-down-right'}
                size={16}
                color={dailyChangePositive ? Colors.success : Colors.error}
              />
              <Text style={[styles.dailyChangeText, { color: dailyChangePositive ? Colors.success : Colors.error }]}>
                {dailyChangeText}
              </Text>
            </View> */}
          </View>
        </View>
        {/* --- END: New Portfolio Section --- */}

        {/* Assets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
        </View>

        {/* Asset Cards */}
        <View style={styles.assetCardsContainer}>
          {/* SOL Token */}
          <AssetCard
            name='Solana'
            ticker='SOL'
            balance={solBalance}
            price={solPrice}
            value={solValue}
            Icon={SolanaIcon}
            accent={Colors.primary}
            onPress={() => handleAssetPress('Solana', solBalance, 'SOL', solValue, solPrice, SolanaIcon)}
          />

          {/* TEAM Token */}
          <AssetCard
            name='Team556'
            ticker='TEAM'
            balance={teamBalance}
            price={teamPrice}
            value={teamValue}
            Icon={TeamIcon}
            accent={Colors.secondary}
            onPress={() => handleAssetPress('Team', teamBalance, 'TEAM', teamValue, teamPrice, TeamIcon)}
          />
        </View>

        {/* Recent Activity Section */}
        {/* <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyActivity}>
          <Text style={styles.emptyActivityText} preset='h4'>
            Coming Soon
          </Text>
        </View> */}
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContentContainer: {
    paddingTop: 8 // Keep top padding within scroll content if needed
  },
  // --- BEGIN: Added Styles for Portfolio Section ---
  portfolioSectionContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20 // Spacing before the asset cards
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarInitial: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600'
  },
  userNameText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  portfolioDetailsContainer: {
    // alignItems: 'flex-start', // Default, but good to be explicit if needed
  },
  portfolioLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8
  },
  portfolioValueText: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8
  },
  dailyChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dailyChangeText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500'
  },
  // --- END: Added Styles for Portfolio Section ---
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
  assetCardsContainer: {
    marginBottom: 16,
    gap: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    opacity: 0.9
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary // Use primary color for links
  },
  emptyActivity: {
    height: 120,
    backgroundColor: Colors.backgroundDark, // Use defined subtle card background
    borderColor: Colors.backgroundLight,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyActivityText: {
    color: Colors.textTertiary, // Use tertiary text color
    marginTop: 8
  }
})
