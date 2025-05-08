import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from '@team556/ui';
import { Colors } from '@/constants/Colors';
import { formatBalance, formatPrice } from '@/utils/formatters'; // Assuming these utils exist

interface AssetCardProps {
  name: string;
  ticker: string;
  balance: number | null;
  price: number | null;
  value: number | null;
  Icon: React.FC<any>; // Consider a more specific type for Icon props if available
  accent: string;
  onPress: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  name,
  ticker,
  balance,
  price,
  value,
  Icon,
  accent,
  onPress
}) => {
  // Animation for press feedback
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

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
                  {formatPrice(price)} / {ticker}
                </Text>
              )}
            </View>
            <Text style={styles.assetValue}>{formatPrice(value)}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  assetCardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundDark,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.backgroundSubtle,
    position: 'relative' // For the accent line if re-enabled
  },
  // assetCardAccent: { // Original thin accent line, replaced by borderLeftWidth on container
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   width: 2, // Kept original width, but it's not used if borderLeftWidth is active
  //   height: '100%',
  //   opacity: 0.7
  // },
  assetCardContent: {
    padding: 16
  },
  assetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  assetIconWrapper: {
    marginRight: 12
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Default, overridden by accent + '15'
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundSubtle, // Default, overridden by accent
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  assetTitleContainer: {
    flex: 1
  },
  assetName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text
  },
  assetTicker: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  tickerAndChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  positiveChange: {
    color: Colors.success
  },
  negativeChange: {
    color: Colors.error
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: '600'
  },
  assetBalanceContainer: {
    marginVertical: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle
  },
  assetBalanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  assetUnitPrice: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  assetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary
  }
});

export default AssetCard;
