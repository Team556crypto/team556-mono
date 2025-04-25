import React, { useEffect, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useWalletStore } from '@/store/walletStore'
import { Ionicons } from '@expo/vector-icons'
import { BalanceCard } from '@/components/BalanceCard'
import { ScreenLayout } from '@/components/ScreenLayout'
import SolanaIcon from '@/assets/images/solana.svg'
import TeamIcon from '@/assets/images/team.svg'
import { formatWalletAddress } from '@/utils/formatters'
import { useWalletClipboard } from '@/hooks/useWalletClipboard'

export default function HomeScreen() {
  const { user, token } = useAuthStore()
  const { showToast } = useToastStore()

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
  }

  // Prepare the header right element
  const headerRightElement = walletAddress ? (
    <View style={styles.addressContainer}>
      <Text style={styles.addressText}>{formatWalletAddress(walletAddress)}</Text>
      <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
        <Ionicons name='copy-outline' size={16} color={Colors.tint} />
      </TouchableOpacity>
    </View>
  ) : null

  // Otherwise, render the main content
  return (
    <ScreenLayout
      title='Wallet'
      headerIcon={<Ionicons name='wallet' size={24} color={Colors.tint} />}
      headerRightElement={headerRightElement}
    >
      {/* Cards Container */}
      <View>
        <BalanceCard
          symbol='SOL'
          name='Solana'
          balance={solBalance}
          price={solPrice}
          value={solValue}
          error={solError}
          iconComponent={<SolanaIcon width={26} height={26} />}
        />
        <BalanceCard
          symbol='TEAM'
          name='Team Token'
          balance={teamBalance}
          price={teamPrice}
          value={teamValue}
          error={teamError}
          iconComponent={<TeamIcon width={40} height={40} />}
        />
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10
  },
  addressText: {
    color: Colors.icon,
    fontSize: 14
  },
  copyButton: {
    // Add padding if needed, but icon size might be enough
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Position content (indicator) at the bottom
    alignItems: 'flex-end', // Position content (indicator) at the right
    padding: 30 // Add some padding from the edges
  }
})
