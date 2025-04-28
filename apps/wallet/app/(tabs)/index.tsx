import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native'
import { Text, Button } from '@team556/ui'
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
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDrawerStore } from '@/store/drawerStore'
import SendDrawerContent from '@/components/SendDrawerContent'
import ReceiveDrawerContent from '@/components/ReceiveDrawerContent'
import SwapDrawerContent from '@/components/SwapDrawerContent'

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
        {/* <BalanceCard
          symbol='TEAM'
          name='Team Token'
          balance={teamBalance}
          price={teamPrice}
          value={teamValue}
          error={teamError}
          iconComponent={<TeamIcon width={40} height={40} />}
        /> */}
      </View>

      {/* Action Buttons Container */}
      <View style={styles.buttonContainer}>
        {/* Receive Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleReceivePress}>
          <View style={[styles.buttonContent, isTabletOrLarger && styles.buttonContentLarge]}>
            <Ionicons name='arrow-down-circle-outline' size={24} color={Colors.tint} />
            <Text style={styles.buttonLabel}>Receive</Text>
          </View>
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
          <View style={[styles.buttonContent, isTabletOrLarger && styles.buttonContentLarge]}>
            <Ionicons name='arrow-up-circle-outline' size={24} color={Colors.tint} />
            <Text style={styles.buttonLabel}>Send</Text>
          </View>
        </TouchableOpacity>

        {/* Swap Button */}
        {/* <TouchableOpacity style={styles.actionButton} onPress={handleSwapPress}>
          <View style={[styles.buttonContent, isTabletOrLarger && styles.buttonContentLarge]}>
            <Ionicons name='swap-horizontal-outline' size={24} color={Colors.tint} />
            <Text style={styles.buttonLabel}>Swap</Text>
          </View>
        </TouchableOpacity> */}
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
  buttonContainer: {
    flex: 1,
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    flexGrow: 1,
    padding: 14,
    borderRadius: 10
    // Add more styling if needed, e.g., padding
  },
  buttonContent: {
    flexDirection: 'column', // Default: Icon above text
    alignItems: 'center',
    gap: 4
  },
  buttonContentLarge: {
    flexDirection: 'row', // Large screen: Icon beside text
    gap: 8
  },
  buttonLabel: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'System' // Use your app's font
  },
  receiveAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  receiveAddressText: {
    color: Colors.text,
    fontSize: 16
  },
  receiveCopyButton: {
    // Add padding if needed, but icon size might be enough
  }
})
