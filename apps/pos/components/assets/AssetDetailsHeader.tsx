import React from 'react'
import { View } from 'react-native'
import { Text } from '@team556/ui'
import { assetDetailsStyles as styles } from './styles' // Adjusted import path
import { Colors } from '@/constants/Colors'

interface AssetDetailsHeaderProps {
  assetName: string
  IconComponent: React.FC<any>
}

const AssetDetailsHeader: React.FC<AssetDetailsHeaderProps> = ({ assetName, IconComponent }) => {
  return (
    <View style={styles.drawerHeader}>
      <View style={styles.headerIcon}>
        <IconComponent width={38} height={38} />
      </View>
      <Text preset='h3' style={styles.drawerTitle}>
        {assetName}
      </Text>
    </View>
  )
}

export default AssetDetailsHeader
