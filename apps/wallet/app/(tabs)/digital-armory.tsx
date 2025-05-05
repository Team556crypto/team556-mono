import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons' // Example icon import

export default function DigitalArmoryScreen() {
  return (
    <ScreenLayout
      title='Digital Armory'
      headerIcon={<Ionicons name='shield-checkmark' size={24} color={Colors.primary} />} // Example icon
    >
      <View style={styles.container}></View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  placeholderText: {
    marginTop: 20,
    color: Colors.textSecondary,
    fontStyle: 'italic'
  }
})
