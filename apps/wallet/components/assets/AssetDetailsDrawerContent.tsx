import React from 'react'
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import AssetDetailsHeader from './AssetDetailsHeader'
import AssetInfoDisplay from './AssetInfoDisplay'
import ActionButton from './ActionButton'

interface AssetDetailsDrawerContentProps {
  assetName: string
  balance: number | null
  ticker: string
  value: number | null
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
  IconComponent,
  // walletAddress, // Not directly used by this component anymore
  onReceivePress,
  onSendPress,
  onSwapPress,
  onClose
}) => {
  const accentColor = ticker === 'SOL' ? Colors.primary : Colors.primarySubtle

  return (
    <View style={styles.drawerContentContainer}>
      <AssetDetailsHeader assetName={assetName} IconComponent={IconComponent} />
      <AssetInfoDisplay balance={balance} ticker={ticker} value={value} />

      <View style={styles.drawerActionsContainer}>
        <ActionButton icon='arrow-down-outline' label='Receive' onPress={onReceivePress} color={accentColor} />
        <ActionButton icon='arrow-up-outline' label='Send' onPress={onSendPress} color={accentColor} />
        <ActionButton icon='swap-horizontal-outline' label='Swap' onPress={onSwapPress} color={accentColor} />
      </View>

      <TouchableOpacity onPress={onClose} style={styles.drawerCloseButton} activeOpacity={0.7}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  drawerContentContainer: {
    padding: 20,
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: Platform.OS === 'android' ? 10 : 0
  },
  drawerActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSubtle
  },
  drawerCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 8,
    alignItems: 'center'
  },
  closeButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500'
  }
})

export default AssetDetailsDrawerContent
