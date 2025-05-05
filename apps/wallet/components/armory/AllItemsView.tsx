import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Badge } from '@team556/ui'

export const AllItemsView = () => {
  return (
    <View style={styles.container}>
      <View>
        <Text preset='h4'>Firearms</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainerStyle}
        ></ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 24
  },
  scrollView: {
    flexGrow: 0
  },
  contentContainerStyle: {
    gap: 8
  }
})
