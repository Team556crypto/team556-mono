import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { Text } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@team556/ui'

// Responsive breakpoints
const LARGE_SCREEN_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1200

export const AmmoView = () => {
  const { colors } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  
  return (
    <View style={styles.container}>
      <View style={styles.comingSoonContainer}>
        <MaterialCommunityIcons 
          name="ammunition" 
          size={screenWidth >= LARGE_SCREEN_BREAKPOINT ? 100 : 80} 
          color={colors.primary} 
        />
        <Text 
          preset={screenWidth >= LARGE_SCREEN_BREAKPOINT ? "h3" : "h4"} 
          style={{ marginTop: 16, color: colors.text }}
        >
          Ammo Inventory
        </Text>
        <Text 
          style={{ 
            marginTop: 16, 
            color: colors.textSecondary, 
            textAlign: 'center',
            maxWidth: screenWidth >= DESKTOP_BREAKPOINT ? 500 : 300,
            fontSize: screenWidth >= LARGE_SCREEN_BREAKPOINT ? 16 : 14
          }}
        >
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
    padding: 20,
    marginHorizontal: 'auto',
    maxWidth: '100%'
  }
})
