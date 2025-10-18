import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share, Linking, ActivityIndicator, Platform, Dimensions, Animated } from 'react-native'
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
  const { width } = Dimensions.get('window')
  const isLargeScreen = width > 768

  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralHistory | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Animation states
  const [copyAnimation] = useState(new Animated.Value(1))
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false)

  const showSuccessFeedback = (message: string) => {
    setSuccessMessage(message)
    setShowCopiedFeedback(true)

    // Animate the success message
    Animated.sequence([
      Animated.timing(copyAnimation, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(copyAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start()

    // Hide after 2 seconds
    setTimeout(() => {
      setShowCopiedFeedback(false)
      setSuccessMessage(null)
    }, 2000)
  }

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
              showSuccessFeedback('Your referral code has been regenerated!')
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
      showSuccessFeedback('Referral code copied to clipboard!')
    }
  }

  const handleCopyLink = async () => {
    if (stats?.referral_code) {
      const shareUrl = `https://wallet.team556.com/signup?ref=${stats.referral_code}`
      await Clipboard.setStringAsync(shareUrl)
      showSuccessFeedback('Referral link copied to clipboard!')
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text preset="paragraph" style={styles.loadingText}>Loading referral data...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
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
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Success Feedback Overlay */}
      {showCopiedFeedback && (
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successMessage, { transform: [{ scale: copyAnimation }] }]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </Animated.View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="people-outline" size={24} color={Colors.primary} />
              </View>
              <Text preset="h2" style={styles.title}>Referral Dashboard</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Share your code and earn rewards</Text>
        </View>

        {/* Main Referral Code Card */}
        <View style={[styles.mainCard, styles.referralCodeCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="gift-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Your Referral Code</Text>
            </View>
            {stats?.referral_code && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>

          {stats?.referral_code ? (
            <View style={styles.referralCodeContainer}>
              <View style={styles.codeDisplay}>
                <Text preset="h1" style={styles.referralCode}>{stats.referral_code}</Text>
                <TouchableOpacity
                  style={styles.quickCopyButton}
                  onPress={handleCopyCode}
                >
                  <Ionicons name="copy" size={20} color={Colors.background} />
                </TouchableOpacity>
              </View>

              <View style={styles.urlContainer}>
                <Text style={styles.urlText}>wallet.team556.com/signup?ref={stats.referral_code}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                  <View style={styles.actionButtonIcon}>
                    <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionButtonText}>Copy Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                  <View style={styles.actionButtonIcon}>
                    <Ionicons name="link-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionButtonText}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <View style={styles.actionButtonIcon}>
                    <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleRegenerateCode}
                disabled={regenerating}
              >
                {regenerating ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                )}
                <Text style={styles.regenerateText}>
                  {regenerating ? "Regenerating..." : "Regenerate Code"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                No referral code generated yet
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleRegenerateCode}
                disabled={regenerating}
              >
                <Text style={styles.generateButtonText}>Generate Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: Colors.backgroundCard }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primarySubtle }]}>
                <Ionicons name="people-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.total_referrals || 0}</Text>
              <Text style={styles.statLabel}>Total Signups</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.backgroundCard }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="wallet-outline" size={20} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{stats?.wallet_created_referrals || 0}</Text>
              <Text style={styles.statLabel}>Wallets Created</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.backgroundCard }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.secondarySubtle }]}>
                <Ionicons name="trending-up-outline" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.statValue}>{stats?.team556_holding_referrals || 0}</Text>
              <Text style={styles.statLabel}>Hold Team556</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.backgroundCard }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.tint + '20' }]}>
                <Ionicons name="pie-chart-outline" size={20} color={Colors.tint} />
              </View>
              <Text style={styles.statValue}>
                {stats?.wallet_created_referrals ?
                  Math.round(((stats?.team556_holding_referrals || 0) / stats.wallet_created_referrals) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Token Adoption</Text>
            </View>
          </View>
        </View>

        {/* Conversion Funnel */}
        <View style={[styles.card, styles.funnelCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="funnel-outline" size={20} color={Colors.tint} />
              <Text style={styles.cardTitle}>Conversion Funnel</Text>
            </View>
          </View>
          <View style={styles.conversionItems}>
            <View style={styles.conversionItem}>
              <View style={styles.conversionLeft}>
                <View style={[styles.conversionDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.conversionLabel}>Signup → Wallet</Text>
              </View>
              <Text style={[styles.conversionValue, { color: Colors.success }]}>
                {formatPercentage(stats?.conversion_rate_to_wallet || 0)}
              </Text>
            </View>
            <View style={styles.conversionItem}>
              <View style={styles.conversionLeft}>
                <View style={[styles.conversionDot, { backgroundColor: Colors.secondary }]} />
                <Text style={styles.conversionLabel}>Wallet → Team556</Text>
              </View>
              <Text style={[styles.conversionValue, { color: Colors.secondary }]}>
                {formatPercentage(stats?.conversion_rate_to_team556 || 0)}
              </Text>
            </View>
          </View>
        </View>

      {/* Team556 Token Statistics */}
        {(stats?.team556_holding_referrals || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team556 Token Statistics</Text>
            <View style={[styles.card, styles.tokenCard]}>
              <View style={styles.tokenStats}>
                <View style={styles.tokenStatItem}>
                  <View style={styles.tokenStatIcon}>
                    <Ionicons name="bar-chart-outline" size={18} color={Colors.secondary} />
                  </View>
                  <View style={styles.tokenStatInfo}>
                    <Text style={styles.tokenStatLabel}>Total Volume Referred</Text>
                    <Text style={styles.tokenStatValue}>
                      {formatTokenAmount(stats?.total_team556_volume || 0)} TEAM
                    </Text>
                  </View>
                </View>
                <View style={styles.tokenStatItem}>
                  <View style={styles.tokenStatIcon}>
                    <Ionicons name="calculator-outline" size={18} color={Colors.secondary} />
                  </View>
                  <View style={styles.tokenStatInfo}>
                    <Text style={styles.tokenStatLabel}>Average Balance</Text>
                    <Text style={styles.tokenStatValue}>
                      {formatTokenAmount(stats?.average_team556_balance || 0)} TEAM
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Referrals */}
        {history && history.referrals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            <View style={[styles.card, styles.referralsCard]}>
              {history.referrals.slice(0, 5).map((referral) => (
                <View key={referral.id} style={styles.referralItem}>
                  <View style={styles.referralInfo}>
                    <View style={styles.referralAvatar}>
                      <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.referralDetails}>
                      <Text style={styles.referralUserCode}>User {referral.referred_user_code}</Text>
                      <Text style={styles.referralDate}>
                        Signed up {formatDate(referral.signup_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.referralStatus}>
                    {referral.has_team556 && (
                      <View style={[styles.statusBadge, styles.statusSuccess]}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.statusText}>Has Team556</Text>
                      </View>
                    )}
                    {referral.wallet_created && !referral.has_team556 && (
                      <View style={[styles.statusBadge, styles.statusWallet]}>
                        <Ionicons name="wallet-outline" size={14} color={Colors.tint} />
                        <Text style={styles.statusText}>Has Wallet</Text>
                      </View>
                    )}
                    {!referral.wallet_created && (
                      <View style={[styles.statusBadge, styles.statusBasic]}>
                        <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.statusText}>Signed Up</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {history.total > 5 && (
                <View style={styles.moreContainer}>
                  <Text style={styles.moreIndicator}>
                    ... and {history.total - 5} more referrals
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Activity Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          <View style={[styles.card, styles.timelineCard]}>
            <View style={styles.timelineItems}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.primary }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>First Referral</Text>
                  <Text style={styles.timelineValue}>{formatDate(stats?.first_referral_at)}</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.secondary }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Most Recent Referral</Text>
                  <Text style={styles.timelineValue}>{formatDate(stats?.most_recent_referral_at)}</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.textSecondary }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Last Updated</Text>
                  <Text style={styles.timelineValue}>{formatDate(stats?.last_calculated_at)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Referrals Work</Text>
          <View style={[styles.card, styles.howItWorksCard]}>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primarySubtle }]}>
                  <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Share</Text>
                  <Text style={styles.stepDescription}>
                    Share your referral code or link with friends
                  </Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primarySubtle }]}>
                  <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Sign Up</Text>
                  <Text style={styles.stepDescription}>
                    They sign up using your code
                  </Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primarySubtle }]}>
                  <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Track Progress</Text>
                  <Text style={styles.stepDescription}>
                    Track when they create a wallet and acquire Team556 tokens
                  </Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primarySubtle }]}>
                  <Text style={[styles.stepNumberText, { color: Colors.primary }]}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Earn Rewards</Text>
                  <Text style={styles.stepDescription}>
                    Watch your referral wallet adoption and Team556 holding rates grow
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDarker,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  // Success Feedback
  successOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.success + '40',
    gap: 8,
  },
  successText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 14,
  },
  // Header
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 52,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSubtle,
  },
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  // Main Cards
  mainCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  referralCodeCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  activeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  // Referral Code Display
  referralCodeContainer: {
    gap: 16,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  referralCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  quickCopyButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  urlContainer: {
    backgroundColor: Colors.backgroundLight,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  urlText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  actionButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  regenerateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  generateButtonText: {
    color: Colors.backgroundDarkest,
    fontWeight: '600',
    fontSize: 14,
  },
  // Statistics Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Conversion Funnel
  funnelCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.tint,
  },
  conversionItems: {
    gap: 4,
  },
  conversionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  conversionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conversionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  conversionLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  conversionValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Token Statistics
  tokenCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  tokenStats: {
    gap: 20,
  },
  tokenStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tokenStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenStatInfo: {
    flex: 1,
  },
  tokenStatLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  tokenStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Recent Referrals
  referralsCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.tint,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  referralInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralDetails: {
    flex: 1,
  },
  referralUserCode: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  referralDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  referralStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  statusSuccess: {
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  statusWallet: {
    backgroundColor: Colors.tint + '20',
    borderWidth: 1,
    borderColor: Colors.tint + '40',
  },
  statusBasic: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  moreIndicator: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  // Timeline
  timelineCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.textSecondary,
  },
  timelineItems: {
    gap: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timelineValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  // How It Works
  howItWorksCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
  },
  stepsContainer: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: Colors.error,
    fontSize: 18,
    fontWeight: '600',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 120,
  },
})