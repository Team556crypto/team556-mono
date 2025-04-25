import React, { useEffect, useCallback } from 'react'
import { SafeAreaView, StyleSheet, ScrollView, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useWalletStore } from '@/store/walletStore'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { BalanceCard } from '@/components/BalanceCard'
import SolanaIcon from '@/assets/images/solana.svg'
import TeamIcon from '@/assets/images/team.svg'

// Helper function to truncate the address
const truncateAddress = (address: string | undefined, startLength = 4, endLength = 4): string => {
  if (!address) return ''
  if (address.length <= startLength + endLength) return address
  return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`
}

export default function HomeScreen() {
  const { isTabletOrLarger } = useBreakpoint()
  const { user, token } = useAuthStore()
  const { showToast } = useToastStore()

  // Use state and actions from the wallet store
  const {
    solBalance,
    solPrice,
    isSolLoading,
    solError,
    fetchSolBalance,
    teamBalance,
    teamPrice,
    isTeamLoading,
    teamError,
    fetchTeamBalance
  } = useWalletStore()

  const loadData = useCallback(async () => {
    if (token) {
      await Promise.all([fetchSolBalance(), fetchTeamBalance()])
    }
  }, [token, fetchSolBalance, fetchTeamBalance])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate SOL value
  const solValue = typeof solBalance === 'number' && typeof solPrice === 'number' ? solBalance * solPrice : 0
  const teamValue = typeof teamBalance === 'number' && typeof teamPrice === 'number' ? teamBalance * teamPrice : 0
  const totalValue = solValue + teamValue

  useEffect(() => {
    if (solError) {
      Alert.alert('Error Fetching SOL Balance', solError)
    } else if (teamError) {
      Alert.alert('Error Fetching TEAM Balance', teamError)
    }
  }, [solError, teamError])

  // Assuming the first wallet is the primary one to display
  const walletAddress = user?.wallets?.[0]?.address

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress)
      showToast('Address copied!', 'success')
    }
  }

  return (
    <>
      <SafeAreaView style={styles.wrapper}>
        <ScrollView style={[styles.container, isTabletOrLarger && styles.containerTablet]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text preset='h2'>Wallet</Text>
            {walletAddress && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>{truncateAddress(walletAddress)}</Text>
                <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
                  <Ionicons name='copy-outline' size={20} color={Colors.tint} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Cards Container */}
          <View style={[styles.cardsContainer, isTabletOrLarger && styles.cardsContainerTablet]}>
            {/* --- SOL Balance Card (Dynamic) --- */}
            <BalanceCard
              symbol='SOL'
              name='Solana'
              balance={solBalance}
              price={solPrice}
              value={solValue}
              isLoading={isSolLoading}
              error={solError}
              iconComponent={<SolanaIcon width={26} height={26} />}
            />

            {/* --- TEAM Token Balance Card --- */}
            <BalanceCard
              symbol='TEAM'
              name='Team Token'
              balance={teamBalance}
              price={teamPrice}
              value={teamValue}
              isLoading={isTeamLoading}
              error={teamError}
              iconComponent={<TeamIcon width={40} height={40} />}
            />

            {/* --- Other Token Cards (from tokenData) --- */}
            {/* 
            {tokenData.map((token, index) => (
              <View key={index} style={[styles.card, isTabletOrLarger && styles.cardTablet]}>
                <Text preset='h4' style={styles.cardTitle}>
                  {token.name}
                </Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Price Per Token:</Text>
                  <Text style={styles.cardValue}>${token.price.toFixed(2)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Balance:</Text>
                  <Text style={styles.cardValue}>{token.balance.toLocaleString()}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Value:</Text>
                  <Text style={[styles.cardValue, styles.cardValueBold]}>
                    ${token.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            ))}
            */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  containerTablet: {
    marginLeft: 240,
    paddingTop: 24,
    paddingRight: 32
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  addressText: {
    color: Colors.icon,
    marginRight: 8,
    fontSize: 14
  },
  copyButton: {
    // Add padding if needed, but icon size might be enough
  },
  cardsContainer: {
    // marginTop: 20
  },
  cardsContainerTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  cardTablet: {
    flexBasis: '49%',
    maxWidth: '49%',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 22
    // Adjust flex basis if padding/margins require: calc(50% - 16px)
  },
  cardTitle: {
    marginBottom: 12,
    color: Colors.tint
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  cardLabel: {
    color: Colors.icon,
    fontSize: 14
  },
  cardValue: {
    fontSize: 14,
    color: Colors.text
  },
  cardValueBold: {
    fontWeight: '600'
  }
})
