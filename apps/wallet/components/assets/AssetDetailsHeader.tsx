import React from 'react'
import { View } from 'react-native'
import { Text } from '@team556/ui'
import { assetDetailsStyles as styles } from './styles' // Adjusted import path

interface AssetDetailsHeaderProps {
  assetName: string
  IconComponent: React.FC<any>
}

const AssetDetailsHeader: React.FC<AssetDetailsHeaderProps> = ({ assetName, IconComponent }) => {
  return (
    <View style={styles.drawerHeader}>
      <IconComponent width={38} height={38} />
      <Text preset='h3' style={styles.drawerTitle}>
        {assetName}
      </Text>
    </View>
  )
}

export default AssetDetailsHeader
