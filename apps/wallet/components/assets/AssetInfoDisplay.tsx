import React from 'react'
import { View } from 'react-native'
import { Text } from '@team556/ui'
import { formatBalance, formatPrice } from '@/utils/formatters'
import { assetDetailsStyles as styles } from './styles' // Adjusted import path
import { Colors } from '@/constants/Colors'

interface AssetInfoDisplayProps {
  balance: number | null
  ticker: string
  value: number | null
}

const AssetInfoDisplay: React.FC<AssetInfoDisplayProps> = ({ balance, ticker, value }) => {
  // Calculate the price per token if both balance and value are available
  const getPricePerToken = () => {
    if (balance && value && balance > 0) {
      return value / balance;
    }
    return null;
  };

  const pricePerToken = getPricePerToken();
  
  return (
    <View style={styles.infoContainer}>
      {/* Primary token amount */}
      <Text style={styles.balanceAmount}>
        {formatBalance(balance)} {ticker}
      </Text>
      
      {/* USD value */}
      <Text style={styles.valueAmount}>
        {formatPrice(value)}
      </Text>
      
      {/* Only show price per token if available */}
      {pricePerToken !== null && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>
            {ticker} Price: {formatPrice(pricePerToken)}
          </Text>
        </View>
      )}
    </View>
  )
}

export default AssetInfoDisplay
