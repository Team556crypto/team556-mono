import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Ionicons } from '@expo/vector-icons'

interface BalanceCardProps {
  symbol: string
  name: string
  balance: number | null
  price: number | null
  value: number | null
  isLoading: boolean
  error: string | null
  iconComponent?: React.ReactNode
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  symbol,
  name,
  balance,
  price,
  value,
  isLoading,
  error,
  iconComponent
}) => {
  const { isTabletOrLarger } = useBreakpoint()

  return (
    <View style={[styles.card, isTabletOrLarger && styles.cardTablet]}>
      {/* Top Row: Icon, Symbol, Name */}
      <View style={styles.topRow}>
        {iconComponent && <View style={styles.iconContainer}>{iconComponent}</View>}
        <View style={styles.titleContainer}>
          <Text preset='h4' style={styles.symbolText}>
            {symbol}
          </Text>
          <Text preset='default' style={styles.nameText}>
            {name}
          </Text>
        </View>
      </View>

      {/* Middle Row: Balance */}
      <View style={styles.balanceRow}>
        {isLoading ? (
          <ActivityIndicator size='small' color={Colors.tint} />
        ) : typeof balance === 'number' ? (
          <Text style={styles.balanceText}>
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </Text>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name='warning-outline' size={16} color={Colors.error} style={styles.errorIcon} />
            <Text style={styles.errorText}>Error fetching balance</Text>
          </View>
        ) : (
          <Text style={styles.balanceText}>--</Text>
        )}
      </View>

      {/* Bottom Row: USD Value & Price */}
      <View style={styles.bottomRow}>
        {/* USD Value */}
        <View style={styles.valueContainer}>
          {isLoading ? (
            <ActivityIndicator size='small' color={Colors.tint} />
          ) : typeof value === 'number' ? (
            <Text style={styles.valueText}>
              ≈ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          ) : error ? (
            <Text style={styles.errorText}>--</Text>
          ) : (
            <Text style={styles.valueText}>--</Text>
          )}
        </View>

        {/* Price Info */}
        <View style={styles.priceContainer}>
          {isLoading ? (
            <ActivityIndicator size='small' color={Colors.tint} />
          ) : typeof price === 'number' ? (
            <Text style={styles.priceText}>
              @ ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </Text>
          ) : error ? (
            <Text style={styles.errorText}>Error</Text>
          ) : (
            <Text style={styles.priceText}>--</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: '100%'
  },
  cardTablet: {
    width: '49%'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleContainer: {
    flex: 1
  },
  symbolText: {
    fontWeight: '600',
    color: Colors.text
  },
  nameText: {
    color: Colors.icon,
    fontSize: 14
  },
  balanceRow: {
    marginBottom: 8
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4
  },
  valueContainer: {},
  valueText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text
  },
  priceContainer: {},
  priceText: {
    fontSize: 14,
    color: Colors.icon
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 14,
    color: Colors.error
  },
  errorIcon: {
    marginRight: 5
  }
})
