import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@team556/ui'

export const NfaView = () => {
  return (
    <View style={styles.container}>
      <Text>NFA View</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 24
  }
})
