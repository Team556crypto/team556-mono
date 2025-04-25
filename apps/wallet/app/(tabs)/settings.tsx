import React from 'react'
import { SafeAreaView, StyleSheet, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/api'

export default function SettingsScreen() {
  const router = useRouter()
  const { logout: clearAuthStore, token } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logoutUser(token)
    } catch (error) {
      console.error('Failed to logout on server:', error)
    } finally {
      clearAuthStore()
      router.replace('/login')
    }
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView style={{ padding: 14, marginBottom: 50 }}>
          <View style={styles.logoutButtonContainer}>
            <Button title='Logout' onPress={handleLogout} variant='danger' />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  logoutButtonContainer: {
    marginTop: 30,
    alignItems: 'center'
  }
})
