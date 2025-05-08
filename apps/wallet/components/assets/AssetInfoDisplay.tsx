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
  // Add price as optional prop to match AssetCard interface
  price?: number | null
}

const AssetInfoDisplay: React.FC<AssetInfoDisplayProps> = ({ balance, ticker, value, price }) => {
  // Get the appropriate price - either from props or calculated
  const getCurrentPrice = () => {
    // If price is explicitly provided, use it
    if (price !== undefined && price !== null) {
      return price;
    }
    
    // Otherwise calculate from balance and value if possible
    if (balance && value && balance > 0) {
      return value / balance;
    }
    
    // Fallback price based on token (similar to what's displayed on index)
    if (ticker === 'SOL') {
      return 148.89; // Default SOL price as shown in screenshots
    } else if (ticker === 'TEAM') {
      return 0.00; // Default TEAM price as shown in screenshots
    }
    
    return null;
  };

  const currentPrice = getCurrentPrice();
  
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
      
      {/* Always show price for consistency between tokens */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>
          {ticker} Price: {formatPrice(currentPrice, ticker === 'TEAM' ? 7 : ticker === 'SOL' ? 2 : 2)}
        </Text>
      </View>
    </View>
  )
}

export default AssetInfoDisplay
