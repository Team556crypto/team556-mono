import React from 'react'
import { View } from 'react-native'
import { Text } from '@team556/ui'
import { formatBalance, formatPrice } from '@/utils/formatters'
import { assetDetailsStyles as styles } from './styles' // Adjusted import path

interface AssetInfoDisplayProps {
  balance: number | null
  ticker: string
  value: number | null
}

const AssetInfoDisplay: React.FC<AssetInfoDisplayProps> = ({ balance, ticker, value }) => {
  return (
    <View style={styles.drawerInfoSection}>
      <View style={styles.drawerDetailRow}>
        <Text style={styles.drawerLabel}>Balance</Text>
        <Text preset='h4' style={styles.drawerValue}>
          {formatBalance(balance)} {ticker}
        </Text>
      </View>

      <View style={[styles.drawerDetailRow, styles.lastDetailRow]}>
        <Text style={styles.drawerLabel}>Value</Text>
        <Text preset='h4' style={styles.drawerValue}>
          {formatPrice(value)}
        </Text>
      </View>
    </View>
  )
}

export default AssetInfoDisplay
