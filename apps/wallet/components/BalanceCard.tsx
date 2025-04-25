import React from 'react'
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Ionicons } from '@expo/vector-icons'
import { formatBalance, formatPrice } from '@/utils/formatters' // Assuming you have these formatters

interface BalanceCardProps {
  symbol: string
  name: string
  balance: number | null | undefined
  price: number | null | undefined
  value?: number | null // Optional pre-calculated value
  isLoading?: boolean
  error?: string | null
  iconComponent?: React.ReactNode
  onPress?: () => void // Add onPress prop
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  symbol,
  name,
  balance,
  price,
  value,
  isLoading = false, // Default isLoading to false
  error,
  iconComponent,
  onPress // Add onPress handler
}) => {
  const { isTabletOrLarger } = useBreakpoint()

  // Determine display values, showing '--' if loading, error, or data is null/undefined
  const displayBalance = isLoading || error || balance === null || balance === undefined ? '--' : formatBalance(balance) // Use formatter
  const displayValue = isLoading || error || value === null || value === undefined ? '--' : formatPrice(value) // Use formatter
  const displayPrice = isLoading || error || price === null || price === undefined ? '--' : formatPrice(price) // Use formatter

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={[styles.card, isTabletOrLarger && styles.cardTablet]}>
        {/* Top Row: Icon, Symbol, Name */}
        <View style={styles.topRow}>
          {iconComponent && <View style={styles.iconContainer}>{iconComponent}</View>}
          <View style={styles.titleContainer}>
            <Text preset='h4' style={styles.symbolText}>
              {symbol}
            </Text>
            <Text style={styles.nameText}>{name}</Text>
          </View>
        </View>

        {/* Middle Row: Balance */}
        <View style={styles.balanceRow}>
          {error && !isLoading ? ( // Show error only if not loading
            <View style={styles.errorContainer}>
              <Ionicons name='warning-outline' size={16} color={Colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>Error fetching</Text>
            </View>
          ) : (
            <Text style={styles.balanceText} numberOfLines={1} ellipsizeMode='tail'>
              {displayBalance}
            </Text>
          )}
        </View>

        {/* Bottom Row: USD Value & Price */}
        <View style={styles.bottomRow}>
          {/* USD Value */}
          <View style={styles.valueContainer}>
            {!error &&
              !isLoading && ( // Show value only if no error and not loading
                <Text style={styles.valueText} numberOfLines={1} ellipsizeMode='tail'>
                  ≈ {displayValue}
                </Text>
              )}
            {(error || isLoading) && <Text style={styles.valueText}>--</Text>}
          </View>

          {/* Price Info */}
          <View style={styles.priceContainer}>
            {!error &&
              !isLoading && ( // Show price only if no error and not loading
                <Text style={styles.priceText} numberOfLines={1} ellipsizeMode='tail'>
                  @ {displayPrice}
                </Text>
              )}
            {(error || isLoading) && <Text style={styles.priceText}>--</Text>}
          </View>
        </View>

        {/* Loading Indicator Overlay (Bottom Right) */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='small' color={Colors.tint} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundDark, // Use theme color
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative' // Needed for absolute positioning,
  },
  cardTablet: {
    // Optional: different styles for tablets
    width: '100%' // Ensure card takes full width of its container on larger screens,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    marginRight: 12,
    width: 40, // Fixed width for icon
    height: 40, // Fixed height for icon
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleContainer: {
    flex: 1
  },
  symbolText: {
    fontWeight: 'bold'
    // color: Colors.text, // Use theme color
  },
  nameText: {
    fontSize: 14,
    opacity: 0.8
  },
  balanceRow: {
    marginBottom: 8,
    minHeight: 24, // Ensure row has height even when showing error/placeholder
    justifyContent: 'center' // Center content vertically
  },
  balanceText: {
    fontSize: 20,
    fontWeight: '600',
    // color: Colors.text, // Use theme color
    textAlign: 'left'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorIcon: {
    marginRight: 4
  },
  errorText: {
    fontSize: 14,
    color: Colors.error // Use theme color
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Align items to the bottom
    minHeight: 20 // Ensure row has height
  },
  valueContainer: {
    alignItems: 'flex-start' // Align text to the left
  },
  valueText: {
    fontSize: 14,
    opacity: 0.9
  },
  priceContainer: {
    alignItems: 'flex-end' // Align text to the right
  },
  priceText: {
    fontSize: 12,
    opacity: 0.7
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    // backgroundColor: 'rgba(0,0,0,0.1)', // Optional subtle background
    padding: 2,
    borderRadius: 4
  }
})
