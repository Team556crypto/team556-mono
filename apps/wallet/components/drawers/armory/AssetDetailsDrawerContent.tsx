import React from 'react'
import { View } from 'react-native'
import { Colors } from '@/constants/Colors'
import AssetDetailsHeader from '../../assets/AssetDetailsHeader'
import AssetInfoDisplay from '../../assets/AssetInfoDisplay'
import ActionButton from '../../assets/ActionButton'
import { assetDetailsStyles } from '../../assets/styles'

interface AssetDetailsDrawerContentProps {
  assetName: string
  balance: number | null
  ticker: string
  value: number | null
  price?: number | null // Optional price data for the token
  IconComponent: React.FC<any>
  walletAddress: string | undefined // Retained prop, though not used in this component directly after refactor
  onReceivePress: () => void
  onSendPress: () => void
  onSwapPress: () => void
  onClose: () => void
}

const AssetDetailsDrawerContent: React.FC<AssetDetailsDrawerContentProps> = ({
  assetName,
  balance,
  ticker,
  value,
  price,
  IconComponent,
  // walletAddress, // Not directly used by this component anymore
  onReceivePress,
  onSendPress,
  onSwapPress,
  onClose
}) => {
  // Use color constants based on asset ticker - use existing color constants from the Colors object
  const accentColor = ticker === 'SOL' ? Colors.primary : ticker === 'TEAM' ? Colors.secondary : Colors.primarySubtle

  return (
    <View style={assetDetailsStyles.drawerContentContainer}>
      {/* Asset Header */}
      <AssetDetailsHeader assetName={assetName} IconComponent={IconComponent} />

      {/* Simplified Balance and Value Display */}
      <AssetInfoDisplay balance={balance} ticker={ticker} value={value} price={price} />

      {/* Action Buttons */}
      <View style={assetDetailsStyles.drawerActionsContainer}>
        <ActionButton icon='arrow-down-outline' label='Receive' onPress={onReceivePress} color={accentColor} />
        <ActionButton icon='arrow-up-outline' label='Send' onPress={onSendPress} color={accentColor} />
        <ActionButton icon='swap-horizontal-outline' label='Swap' onPress={onSwapPress} color={accentColor} />
      </View>

      {/* Close Button */}
      {/* <TouchableOpacity onPress={onClose} style={assetDetailsStyles.drawerCloseButton} activeOpacity={0.7}>
        <Text style={assetDetailsStyles.closeButtonText}>Close</Text>
      </TouchableOpacity> */}
    </View>
  )
}

// Using shared styles from styles.ts file now

export default AssetDetailsDrawerContent