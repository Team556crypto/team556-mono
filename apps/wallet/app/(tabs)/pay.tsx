import React from 'react'
import { StyleSheet, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@repo/ui'
import Head from 'expo-router/head'
import { Colors } from '@/constants/Colors'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'

export default function PrivacyScreen() {
  const router = useRouter()

  return (
    <ScreenLayout title='Pay with TEAM' headerIcon={<Ionicons name='card' size={24} color={Colors.tint} />}>
      <Head>
        <title>Pay with TEAM | Team556 Wallet</title>
      </Head>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={{ marginTop: 10 }}>
          <Text>Pay with TEAM coming soon!</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1
  }
})
