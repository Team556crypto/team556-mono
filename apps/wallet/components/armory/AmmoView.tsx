import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@team556/ui'

export const AmmoView = () => {
  const { colors } = useTheme()
  
  return (
    <View style={styles.container}>
      <View style={styles.comingSoonContainer}>
        <MaterialCommunityIcons name="ammunition" size={80} color={colors.primary} />
        <Text preset="h4" style={{ marginTop: 16, color: colors.text }}>
          Ammo Inventory
        </Text>
        <Text style={{ marginTop: 8, color: colors.textSecondary, textAlign: 'center' }}>
          We're still loading up this feature...
          {"\n"}
          Check back soon!
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }
})
