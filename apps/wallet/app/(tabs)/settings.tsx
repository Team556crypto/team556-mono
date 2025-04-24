import React from 'react'
import { SafeAreaView, StyleSheet, ScrollView, View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/api'

export default function SettingsScreen() {
  const router = useRouter()
  const { logout: clearAuthStore } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logoutUser()
      console.log('Server logout request sent.')
    } catch (error) {
      console.error('Failed to logout on server:', error)
      // Optional: Show a non-blocking message to the user
      // Alert.alert("Logout Notice", "Could not reach server, logging out locally.");
    } finally {
      // Always perform client-side logout actions
      clearAuthStore()
      router.replace('/login')
      console.log('hello world')
    }
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView style={{ padding: 14, marginBottom: 50 }}>
          {/* Other settings items can go here */}

          <View style={styles.logoutButtonContainer}>
            <Button title='Logout' onPress={handleLogout} variant='danger' />
            {/* Using a hypothetical 'color' prop for styling */}
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
