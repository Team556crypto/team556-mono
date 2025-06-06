import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@repo/ui'
import { Ionicons } from '@expo/vector-icons'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { format, addWeeks } from 'date-fns'
import { PublicKey } from '@solana/web3.js'

// Interface for vesting card data
interface VestingCardProps {
  vestedPercent: number
  vestedDate: Date
  tokenAmount: number
  isEnabled: boolean
  onClaim: () => void
  isLoading?: boolean
  isClaimed?: boolean
}

// VestingCard component to display vesting information
const VestingCard: React.FC<VestingCardProps> = ({
  vestedPercent,
  vestedDate,
  tokenAmount,
  isEnabled,
  onClaim,
  isLoading = false,
  isClaimed = false
}) => {
  const formattedDate = format(vestedDate, 'MMM dd, yyyy')
  const isVestingDateReached = new Date() >= vestedDate

  let statusText = 'Pending release'
  let statusStyle = styles.statusPending

  if (isClaimed) {
    statusText = 'Claimed'
    statusStyle = styles.statusReady
  } else if (isVestingDateReached) {
    statusText = 'Ready to claim'
    statusStyle = styles.statusReady
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>TEAM Token Vesting</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{`${vestedPercent}%`}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vesting Date:</Text>
          <Text style={styles.infoValue}>{formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tokens Available:</Text>
          <Text style={styles.infoValue}>{tokenAmount.toLocaleString()} TEAM</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, statusStyle]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Button
          title={isClaimed ? 'Claimed' : 'Claim Tokens'}
          onPress={onClaim}
          disabled={!isEnabled || isLoading || isClaimed}
          loading={isLoading}
          style={styles.claimButton}
        />
      </View>
    </View>
  )
}

// Placeholder for your API client - replace with your actual implementation
const apiClient = {
  get: async (endpoint: string, token: string | null) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(errorData.error || errorData.message || 'API request failed')
    }
    return response.json()
  },
  post: async (endpoint: string, body: any, token: string | null) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(errorData.error || errorData.message || 'API request failed')
    }
    return response.json()
  }
}

interface ClaimStatus {
  tokensClaimedP1P1: boolean
  tokensClaimedP1P2: boolean
  tokensClaimedP2: boolean
  hasPresaleCode: boolean
}

const isValidSolanaAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false
  try {
    new PublicKey(address)
    return true
  } catch (e) {
    return false
  }
}

export default function RedeemDashboard() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { showToast } = useToastStore()

  const [isLoading, setIsLoading] = useState(false)

  const [claimStatusLoading, setClaimStatusLoading] = useState(true)
  const [claimProcessingLoading, setClaimProcessingLoading] = useState(false)
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)

  // Specific claim start times
  const p1p1ClaimStartTime = new Date(2025, 4, 27, 17, 0, 0) // May 27, 2025, 5:00 PM local time
  const p1p2ClaimStartTime = addWeeks(new Date(2025, 4, 27, 17, 0, 0), 4) // Placeholder: 4 weeks after P1P1 start, at 5 PM
  const p2ClaimStartTime = addWeeks(new Date(2025, 4, 27, 17, 0, 0), 8) // Placeholder: 8 weeks after P1P1 start, at 5 PM

  // Determine presale type
  const presaleType = user?.presale_type ?? null

  const fetchClaimStatus = async () => {
    if (!token) return
    setClaimStatusLoading(true)
    try {
      const status = await apiClient.get('/presale/claim-status', token)
      setClaimStatus(status)
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch claim status.', 'error')
      setClaimStatus({
        tokensClaimedP1P1: false,
        tokensClaimedP1P2: false,
        tokensClaimedP2: false,
        hasPresaleCode: false
      })
    } finally {
      setClaimStatusLoading(false)
    }
  }

  useEffect(() => {
    fetchClaimStatus()
  }, [token])

  // Handlers
  const handleClaimP1P1 = async () => {
    if (!token) {
      showToast('Authentication token not found.', 'error')
      return
    }

    // Wallet validation
    const walletAddress = user?.wallets?.[0]?.address
    if (!walletAddress) {
      showToast('Wallet address not found. Please ensure your wallet is set up.', 'error')
      return
    }
    if (!isValidSolanaAddress(walletAddress)) {
      showToast('Invalid wallet address format. Please check your wallet.', 'error')
      return
    }

    setClaimProcessingLoading(true)
    try {
      const response = await apiClient.post('/presale/claim/p1p1', {}, token)
      showToast(response.message || 'Tokens claimed successfully!', 'success')
      fetchClaimStatus()
    } catch (error: any) {
      showToast(error.message || 'Failed to claim tokens.', 'error')
    } finally {
      setClaimProcessingLoading(false)
    }
  }

  // Header element (close button)
  const headerElement = (
    <TouchableOpacity onPress={() => router.back()}>
      <Ionicons name='close' size={30} color={Colors.text} />
    </TouchableOpacity>
  )

  return (
    <ScreenLayout
      title='Presale Dashboard'
      headerRightElement={headerElement}
      headerIcon={<Ionicons name='ticket' size={24} color={Colors.tint} />}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header section explaining vesting */}
        <View style={styles.headerSection}>
          <Text style={styles.headerDescription}>
            Your tokens will be available according to the vesting schedule below. Tokens become available on the
            vesting date.
          </Text>
        </View>

        {presaleType === 1 ? (
          // Presale Type 1: Two periods (50% each)
          <>
            <VestingCard
              vestedPercent={50}
              vestedDate={p1p1ClaimStartTime} // Use specific claim start time
              tokenAmount={500000}
              isEnabled={
                (claimStatus?.hasPresaleCode ?? false) &&
                presaleType === 1 &&
                !(claimStatus?.tokensClaimedP1P1 ?? false) &&
                new Date() >= p1p1ClaimStartTime // Explicit check for claim time
              }
              onClaim={handleClaimP1P1}
              isLoading={claimProcessingLoading || claimStatusLoading}
              isClaimed={claimStatus?.tokensClaimedP1P1 ?? false}
            />

            <VestingCard
              vestedPercent={50}
              vestedDate={p1p2ClaimStartTime} // Use specific claim start time
              tokenAmount={500000}
              isEnabled={
                false // P1P2 claim logic not yet implemented
                // (claimStatus?.hasPresaleCode ?? false) &&
                // presaleType === 1 &&
                // !(claimStatus?.tokensClaimedP1P2 ?? false) &&
                // new Date() >= p1p2ClaimStartTime
              }
              onClaim={() => showToast('P1P2 Claim not yet implemented.', 'info')}
              isLoading={claimStatusLoading}
              isClaimed={claimStatus?.tokensClaimedP1P2 ?? false}
            />
          </>
        ) : presaleType === 2 ? (
          // Presale Type 2: One period (100%)
          <VestingCard
            vestedPercent={100}
            vestedDate={p2ClaimStartTime} // Use specific claim start time
            tokenAmount={500000}
            isEnabled={
              false
              // (claimStatus?.hasPresaleCode ?? false) &&
              // presaleType === 2 &&
              // !(claimStatus?.tokensClaimedP2 ?? false) &&
              // new Date() >= p2ClaimStartTime // Explicit check for claim time
            }
            onClaim={() => showToast('P2 Claim not yet implemented.', 'info')}
            isLoading={claimStatusLoading}
            isClaimed={claimStatus?.tokensClaimedP2 ?? false}
          />
        ) : claimStatusLoading ? (
          <View style={styles.centeredMessageContainer}>
            <ActivityIndicator size='large' color={Colors.tint} />
            <Text style={styles.loadingText}>Loading vesting information...</Text>
          </View>
        ) : (
          // No presale type or unknown type, or no presale code
          <View style={styles.notEligibleContainer}>
            <Ionicons name='alert-circle-outline' size={60} color={Colors.error} style={styles.alertIcon} />
            <Text style={styles.notEligibleTitle}>Not Eligible</Text>
            <Text style={styles.notEligibleText}>You are not currently eligible for any token vesting program.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    paddingBottom: 32
  },
  headerSection: {
    marginBottom: 18,
    marginTop: 12
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8
  },
  headerDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDark
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text
  },
  badgeContainer: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold'
  },
  cardBody: {
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.textSecondary
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  statusReady: {
    backgroundColor: Colors.success
  },
  statusPending: {
    backgroundColor: Colors.warning
  },
  statusText: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundDark
  },
  claimButton: {
    // backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.backgroundSubtle
  },
  notEligibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40
  },
  alertIcon: {
    marginBottom: 16
  },
  notEligibleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  notEligibleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary
  }
})
