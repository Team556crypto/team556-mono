import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share, Linking, ActivityIndicator, Platform } from 'react-native'
import { Text, Button } from '@team556/ui'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { 
  generateReferralCode, 
  getReferralStats, 
  getReferralHistory, 
  regenerateReferralCode,
  type ReferralStats,
  type ReferralHistory 
} from '@/services/api'
import * as Clipboard from 'expo-clipboard'

interface ReferralDashboardDrawerContentProps {
  onClose: () => void
}

export default function ReferralDashboardDrawerContent({ onClose }: ReferralDashboardDrawerContentProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralHistory | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadReferralData = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      // Load referral code and stats
      const [referralCode, referralStats] = await Promise.all([
        generateReferralCode(token),
        getReferralStats(token)
      ])

      setStats(referralStats)

      // Load recent referral history (first 10 items)
      if (referralStats.total_referrals > 0) {
        const referralHistory = await getReferralHistory(token, 1, 10)
        setHistory(referralHistory)
      }
    } catch (err: any) {
      console.error('Error loading referral data:', err)
      setError(err.message || 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateCode = async () => {
    if (!token) return

    Alert.alert(
      'Regenerate Referral Code',
      'This will create a new referral code and invalidate your current one. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setRegenerating(true)
              await regenerateReferralCode(token)
              await loadReferralData() // Reload data
              Alert.alert('Success', 'Your referral code has been regenerated!')
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to regenerate referral code')
            } finally {
              setRegenerating(false)
            }
          }
        }
      ]
    )
  }

  const handleCopyCode = async () => {
    if (stats?.referral_code) {
      await Clipboard.setStringAsync(stats.referral_code)
      Alert.alert('Copied!', 'Referral code copied to clipboard')
    }
  }

  const handleCopyLink = async () => {
    if (stats?.referral_code) {
      const shareUrl = `https://wallet.team556.com/signup?ref=${stats.referral_code}`
      await Clipboard.setStringAsync(shareUrl)
      Alert.alert('Copied!', 'Referral link copied to clipboard')
    }
  }

  const handleShare = async () => {
    if (stats?.referral_code) {
      const shareUrl = `https://wallet.team556.com/signup?ref=${stats.referral_code}`
      const message = `Join me on Team556 Digital Armory! Use my referral code ${stats.referral_code} when you sign up. ${shareUrl}`
      
      try {
        await Share.share({
          message,
          url: shareUrl,
          title: 'Join Team556 Digital Armory'
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatTokenAmount = (amount: number) => {
    if (amount === 0) return '0'
    if (amount < 1) return amount.toFixed(4)
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%'
  }

  useEffect(() => {
    loadReferralData()
  }, [token])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text preset="paragraph" style={styles.loadingText}>Loading referral data...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text preset="h4" style={styles.errorTitle}>Error Loading Data</Text>
        <Text preset="paragraph" style={styles.errorMessage}>{error}</Text>
        <Button
          title="Try Again"
          onPress={loadReferralData}
          variant="outline"
          style={styles.retryButton}
        />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text preset="h3" style={styles.title}>Referral Dashboard</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Referral Code Card */}
      <View style={[styles.card, { borderLeftColor: Colors.primary }]}>
        <Text style={styles.cardLabel}>Your Referral Code</Text>
        {stats?.referral_code ? (
          <>
            <Text preset="h1" style={styles.referralCode}>{stats.referral_code}</Text>
            <View style={styles.shareUrlContainer}>
              <Text style={styles.shareUrlText}>wallet.team556.com/signup?ref={stats.referral_code}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Copy Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                <Ionicons name="link-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.regenerateButton} 
              onPress={handleRegenerateCode}
              disabled={regenerating}
            >
              <Text style={styles.regenerateText}>
                {regenerating ? "Regenerating..." : "Regenerate Code"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No referral code generated yet
            </Text>
          </View>
        )}
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: Colors.textSecondary }]}>
          <Text style={styles.statValue}>{stats?.total_referrals || 0}</Text>
          <Text style={styles.statLabel}>Total Signups</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.statValue}>{stats?.wallet_created_referrals || 0}</Text>
          <Text style={styles.statLabel}>Wallets Created</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.secondary }]}>
          <Text style={styles.statValue}>{stats?.team556_holding_referrals || 0}</Text>
          <Text style={styles.statLabel}>Hold Team556</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.statValue}>
            {stats?.wallet_created_referrals ? 
              Math.round(((stats?.team556_holding_referrals || 0) / stats.wallet_created_referrals) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Token Adoption</Text>
        </View>
      </View>

      {/* Conversion Funnel */}
      <View style={[styles.card, { borderLeftColor: Colors.tint }]}>
        <Text style={styles.cardLabel}>Conversion Funnel</Text>
        <View style={styles.conversionItem}>
          <Text style={styles.conversionLabel}>Signup → Wallet</Text>
          <Text style={[styles.conversionValue, { color: Colors.success }]}>
            {formatPercentage(stats?.conversion_rate_to_wallet || 0)}
          </Text>
        </View>
        <View style={styles.conversionItem}>
          <Text style={styles.conversionLabel}>Wallet → Team556</Text>
          <Text style={[styles.conversionValue, { color: Colors.secondary }]}>
            {formatPercentage(stats?.conversion_rate_to_team556 || 0)}
          </Text>
        </View>
      </View>

      {/* Team556 Token Statistics */}
      {(stats?.team556_holding_referrals || 0) > 0 && (
        <View style={styles.card}>
          <Text preset="h4" style={styles.cardTitle}>Team556 Token Statistics</Text>
          <View style={styles.tokenStats}>
            <View style={styles.tokenStatItem}>
              <Text preset="label" color={Colors.textSecondary}>Total Volume Referred</Text>
              <Text preset="h4" style={styles.team556Text}>
                {formatTokenAmount(stats?.total_team556_volume || 0)} TEAM
              </Text>
            </View>
            <View style={styles.tokenStatItem}>
              <Text preset="label" color={Colors.textSecondary}>Average Balance</Text>
              <Text preset="h4" style={styles.team556Text}>
                {formatTokenAmount(stats?.average_team556_balance || 0)} TEAM
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Referrals */}
      {history && history.referrals.length > 0 && (
        <View style={styles.card}>
          <Text preset="h4" style={styles.cardTitle}>Recent Referrals</Text>
          {history.referrals.slice(0, 5).map((referral) => (
            <View key={referral.id} style={styles.referralItem}>
              <View style={styles.referralInfo}>
                <Text preset="label">User {referral.referred_user_code}</Text>
                <Text preset="caption" color={Colors.textSecondary}>
                  Signed up {formatDate(referral.signup_date)}
                </Text>
              </View>
              <View style={styles.referralStatus}>
                {referral.has_team556 && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text preset="caption" color={Colors.success}>Has Team556</Text>
                  </View>
                )}
                {referral.wallet_created && !referral.has_team556 && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.tint} />
                    <Text preset="caption" color={Colors.tint}>Has Wallet</Text>
                  </View>
                )}
                {!referral.wallet_created && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text preset="caption" color={Colors.textSecondary}>Signed Up</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {history.total > 5 && (
            <Text preset="caption" color={Colors.textSecondary} style={styles.moreIndicator}>
              ... and {history.total - 5} more referrals
            </Text>
          )}
        </View>
      )}

      {/* Referral Activity */}
      <View style={styles.card}>
        <Text preset="h4" style={styles.cardTitle}>Activity Timeline</Text>
        <View style={styles.timelineInfo}>
          <Text preset="label" color={Colors.textSecondary}>First Referral</Text>
          <Text preset="paragraph">{formatDate(stats?.first_referral_at)}</Text>
        </View>
        <View style={styles.timelineInfo}>
          <Text preset="label" color={Colors.textSecondary}>Most Recent Referral</Text>
          <Text preset="paragraph">{formatDate(stats?.most_recent_referral_at)}</Text>
        </View>
        <View style={styles.timelineInfo}>
          <Text preset="label" color={Colors.textSecondary}>Last Updated</Text>
          <Text preset="paragraph">{formatDate(stats?.last_calculated_at)}</Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.infoCard}>
        <Text preset="h4" style={styles.infoTitle}>How Referrals Work</Text>
        <View style={styles.infoStep}>
          <Text preset="h4" color={Colors.primary}>1</Text>
          <Text preset="paragraph" style={styles.infoStepText}>
            Share your referral code or link with friends
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text preset="h4" color={Colors.primary}>2</Text>
          <Text preset="paragraph" style={styles.infoStepText}>
            They sign up using your code
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text preset="h4" color={Colors.primary}>3</Text>
          <Text preset="paragraph" style={styles.infoStepText}>
            Track when they create a wallet and acquire Team556 tokens
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text preset="h4" color={Colors.primary}>4</Text>
          <Text preset="paragraph" style={styles.infoStepText}>
            Watch your referral wallet adoption and Team556 holding rates grow
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.backgroundDarker,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.backgroundDarker,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.backgroundDarker,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: Colors.error,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.textSecondary,
  },
  retryButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  // Card Styles
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.backgroundDark,
  },
  cardLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  // Referral Code
  referralCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  shareUrlContainer: {
    backgroundColor: Colors.backgroundSubtle,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  shareUrlText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  regenerateButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  regenerateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  // Empty State
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Statistics
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // Conversion Funnel
  conversionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  conversionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  conversionValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  tokenStats: {
    gap: 16,
  },
  tokenStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  referralInfo: {
    flex: 1,
  },
  referralStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 4,
  },
  moreIndicator: {
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  timelineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    marginBottom: 16,
    color: Colors.primary,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoStepText: {
    flex: 1,
    color: Colors.textSecondary,
  },
})