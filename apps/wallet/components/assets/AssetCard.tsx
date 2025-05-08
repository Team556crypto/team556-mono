import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { formatBalance, formatPrice } from '@/utils/formatters' // Assuming these utils exist

interface AssetCardProps {
  name: string
  ticker: string
  balance: number | null
  price: number | null
  value: number | null
  Icon: React.FC<any> // Consider a more specific type for Icon props if available
  accent: string
  onPress: () => void
}

const AssetCard: React.FC<AssetCardProps> = ({ name, ticker, balance, price, value, Icon, accent, onPress }) => {
  // Animation for press feedback
  const [pressAnim] = useState(new Animated.Value(1))

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start()
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.assetCardContainer,
          {
            transform: [{ scale: pressAnim }],
            borderLeftColor: accent,
            borderLeftWidth: 4
          }
        ]}
      >
        {/* Visual accent element - Note: The original styles.assetCardAccent was for a thin line, the borderLeftWidth above is more prominent */}
        {/* <View style={[styles.assetCardAccent, { backgroundColor: accent }]} /> */}
        <View style={styles.assetCardContent}>
          {/* Card Header with Icon and Names */}
          <View style={styles.assetCardHeader}>
            <View style={styles.assetIconWrapper}>
              <View style={[styles.assetIconContainer, { backgroundColor: accent + '15', borderColor: accent }]}>
                <Icon width={ticker === 'SOL' ? 24 : 30} height={ticker === 'SOL' ? 24 : 30} />
              </View>
            </View>

            <View style={styles.assetTitleContainer}>
              <Text preset='h4' style={styles.assetName}>
                {name}
              </Text>
              <View style={styles.tickerAndChangeContainer}>
                <Text style={styles.assetTicker}>{ticker}</Text>
                {/* Will show price change when data is available */}
                {/*<Text style={[styles.priceChangeText, positiveChange ? styles.positiveChange : styles.negativeChange]}>•</Text>*/}
              </View>
            </View>
          </View>

          {/* Card Balance Display */}
          <View style={styles.assetBalanceContainer}>
            <Text preset='h2' style={styles.assetBalanceAmount}>
              {formatBalance(balance)}{' '}
              <Text preset='h4' style={{ color: Colors.textSecondary }}>
                {ticker}
              </Text>
            </Text>
          </View>

          {/* Card Footer with Price Information */}
          <View style={styles.assetFooter}>
            <View>
              {price !== null && (
                <Text style={styles.assetUnitPrice}>
                  {formatPrice(price, ticker === 'TEAM' ? 7 : ticker === 'SOL' ? 2 : 2)} / {ticker}
                </Text>
              )}
            </View>
            <Text style={styles.assetValueAmount}>{formatPrice(value)}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  assetCardContainer: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 18 : 16, // Slightly more padding for iOS
    marginBottom: 16,
    shadowColor: Colors.black, // Add subtle shadow for depth
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // Android shadow
    borderLeftWidth: 4, // Default border, will be overridden by accent
    borderLeftColor: Colors.backgroundDark // Default subtle border color
  },
  assetCardContent: {
    // flex: 1, // Ensure content takes available space
  },
  assetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  assetIconWrapper: {
    marginRight: 12
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  assetTitleContainer: {
    flex: 1
  },
  assetName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text
  },
  tickerAndChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  assetTicker: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  priceChangeText: {
    fontSize: 14,
    marginLeft: 5
  },
  positiveChange: {
    color: Colors.success // Use success color for positive change
  },
  negativeChange: {
    color: Colors.error // Use error color for negative change
  },
  assetBalanceContainer: {
    marginBottom: 12,
    alignItems: 'flex-start' // Align balance to the left
  },
  assetBalanceAmount: {
    fontSize: 28, // Larger font for balance
    fontWeight: 'bold',
    color: Colors.text
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  assetUnitPrice: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  assetValueAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  }
})

export default AssetCard
