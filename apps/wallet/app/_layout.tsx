import React, { useEffect } from 'react'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { setAppTheme } from '@team556/ui'
import { Colors } from '../constants/Colors'
import { useAuthStore } from '@/store/authStore'
import Toast from '@/components/Toast'

// Configure shared UI components to use the app's colors
setAppTheme(Colors)

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

function InitialLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from secure storage
    initializeAuth()
  }, [])

  useEffect(() => {
    // Wait for both loading state to resolve and auth state to be determined
    if (isLoading) return

    const inAuthGroup = segments[0] === '(tabs)'
    const inOnboarding = segments[0] === 'onboarding'
    const inLogin = segments[0] === 'login'

    if (isAuthenticated) {
      // Ensure user object is loaded before checking wallets
      if (user) {
        const hasWallets = user.wallets && user.wallets.length > 0

        if (hasWallets && !inAuthGroup) {
          router.replace('/(tabs)/' as any)
        } else if (!hasWallets && !inOnboarding) {
          router.replace('/onboarding')
        } else {
          console.log('[Layout] User authenticated and in correct route:', segments[0])
        }
      }
    } else if (!isAuthenticated && !inLogin) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, user, segments])

  // While loading the auth state, show a loading indicator or splash screen
  if (isLoading) {
    // Return a loading component instead of null
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.tint} />
      </View>
    )
  }

  // Once loading is complete, render the main stack navigator
  return (
    <Stack>
      <Stack.Screen name='login' options={{ headerShown: false }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='onboarding' options={{ headerShown: false }} />
      <Stack.Screen name='+not-found' />
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

  useEffect(() => {
    if (error) throw error // Handle font loading error
  }, [error])

  useEffect(() => {
    // Hide splash screen only when fonts are loaded
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  // Prevent rendering until fonts are loaded
  if (!loaded) {
    return null // Keep returning null (splash screen should still be visible)
  }

  // Render the initial layout which handles auth logic
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={DarkTheme}>
        <InitialLayout />
        <Toast />
        <StatusBar style='light' />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background // Use app's background color
  },
  container: {
    flex: 1
  }
})
