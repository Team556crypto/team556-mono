import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@repo/ui'
import { Ionicons } from '@expo/vector-icons'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { genericStyles } from '@/constants/GenericStyles'
import { format, addWeeks } from 'date-fns'

// Interface for vesting card data
interface VestingCardProps {
  vestedPercent: number
  vestedDate: Date
  tokenAmount: number
  isEnabled: boolean
  onClaim: () => void
  isLoading?: boolean
}

// VestingCard component to display vesting information
const VestingCard: React.FC<VestingCardProps> = ({
  vestedPercent,
  vestedDate,
  tokenAmount,
  isEnabled,
  onClaim,
  isLoading = false
}) => {
  const formattedDate = format(vestedDate, 'MMM dd, yyyy')
  const isVestingDateReached = new Date() >= vestedDate

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
          <View style={[styles.statusIndicator, isVestingDateReached ? styles.statusReady : styles.statusPending]} />
          <Text style={styles.statusText}>{isVestingDateReached ? 'Ready to claim' : 'Pending release'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Button
          title='Claim Tokens'
          onPress={onClaim}
          disabled={!isEnabled || !isVestingDateReached || isLoading}
          style={[styles.claimButton, (!isEnabled || !isVestingDateReached) && styles.disabledButton]}
        >
          {isLoading ? <ActivityIndicator color={Colors.text} /> : null}
        </Button>
      </View>
    </View>
  )
}

export default function RedeemDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  // Reference date for vesting calculations - April 27, 2025
  const baseDate = new Date(2025, 3, 27) // Month is 0-indexed (3 = April)

  // Calculate vesting dates from the base date
  const vestingDate4Weeks = addWeeks(baseDate, 4)
  const vestingDate8Weeks = addWeeks(baseDate, 8)
  const vestingDate12Weeks = addWeeks(baseDate, 12)

  // Determine presale type
  const presaleType = user?.presale_type ?? null // Use nullish coalescing for clarity

  // Handlers
  const handleClaimTokens = (vestingIndex: number) => {
    setIsLoading(true)
    // In a real implementation, you would call an API here to claim tokens
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
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
          <Text style={styles.headerTitle}>Your TEAM Token Vesting</Text>
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
              vestedDate={vestingDate4Weeks}
              tokenAmount={500000}
              isEnabled={true}
              onClaim={() => handleClaimTokens(1)}
              isLoading={isLoading}
            />

            <VestingCard
              vestedPercent={50}
              vestedDate={vestingDate8Weeks}
              tokenAmount={500000}
              isEnabled={true}
              onClaim={() => handleClaimTokens(2)}
              isLoading={isLoading}
            />
          </>
        ) : presaleType === 2 ? (
          // Presale Type 2: One period (100%)
          <VestingCard
            vestedPercent={100}
            vestedDate={vestingDate12Weeks}
            tokenAmount={500000}
            isEnabled={true}
            onClaim={() => handleClaimTokens(1)}
            isLoading={isLoading}
          />
        ) : (
          // No presale type or unknown type
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
    marginBottom: 24
  },
  headerTitle: {
    color: Colors.text,
    marginBottom: 8
  },
  headerDescription: {
    color: Colors.text,
    opacity: 0.8,
    marginBottom: 16
  },
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDarker
  },
  cardTitle: {
    color: Colors.text
  },
  badgeContainer: {
    backgroundColor: Colors.tint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14
  },
  cardBody: {
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoLabel: {
    color: Colors.text,
    opacity: 0.7,
    fontSize: 14
  },
  infoValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
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
    backgroundColor: Colors.icon
  },
  statusText: {
    color: Colors.text,
    fontSize: 14
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundDarker
  },
  claimButton: {
    backgroundColor: Colors.tint
  },
  disabledButton: {
    opacity: 0.6
  },
  notEligibleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    marginTop: 24
  },
  alertIcon: {
    marginBottom: 16
  },
  notEligibleTitle: {
    color: Colors.error,
    marginBottom: 8,
    textAlign: 'center'
  },
  notEligibleText: {
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.8
  }
})
