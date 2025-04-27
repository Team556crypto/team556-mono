import React, { useEffect, useState, useCallback } from 'react'
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
import { Drawer } from '@repo/ui'
import { useDrawerStore } from '@/store/drawerStore'

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

    const currentSegment = segments[0] // Get the top-level segment
    const inAuthGroup = currentSegment === '(tabs)'
    const inOnboarding = currentSegment === 'onboarding'
    const inLogin = currentSegment === 'login'
    const allowedStandaloneRoutes = ['privacy', 'terms'] // Explicitly allow these
    const inAllowedStandalone = allowedStandaloneRoutes.includes(currentSegment)

    if (isAuthenticated) {
      // Ensure user object is loaded before checking verification or wallets
      if (user) {
        // Check email verification status FIRST
        if (!user.email_verified) {
          // User's email is not verified, must go to onboarding
          if (!inOnboarding) {
            router.replace('/onboarding')
          } else {
            console.log(`[Layout] Unverified user already in onboarding: ${currentSegment}`)
          }
        } else {
          // Email is verified, proceed with wallet check
          const hasWallets = user.wallets && user.wallets.length > 0

          if (hasWallets) {
            // Verified user with wallets. Should be in tabs or allowed standalone.
            if (!inAuthGroup && !inAllowedStandalone) {
              router.replace('/(tabs)/' as any)
            } else {
              console.log(`[Layout] Verified user with wallets in allowed route: ${currentSegment}`)
            }
          } else {
            // Verified user has no wallets, should be in onboarding
            if (!inOnboarding) {
              router.replace('/onboarding')
            } else {
              console.log(`[Layout] Verified user without wallets in onboarding: ${currentSegment}`)
            }
          }
        }
      } else {
        // User object might still be loading after isAuthenticated is true
        console.log('[Layout] Authenticated but user object not yet available.')
      }
    } else {
      // Not authenticated
      // Redirect to login if not already there
      if (!inLogin) {
        router.replace('/login')
      } else {
        console.log('[Layout] Unauthenticated user in login route.')
      }
    }
    // Add router to dependency array as it's used inside the effect
  }, [isAuthenticated, isLoading, user, segments, router])

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
      <Stack.Screen name='privacy' options={{ headerShown: false }} />
      <Stack.Screen name='terms' options={{ headerShown: false }} />
      <Stack.Screen name='+not-found' />
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

  // Drawer state - Now managed by Zustand
  const {
    isVisible: isDrawerVisible,
    content: drawerContent,
    maxHeight: drawerMaxHeight,
    minHeight: drawerMinHeight,
    closeDrawer
  } = useDrawerStore()

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.tint} />
      </View>
    )
  }

  // Render the initial layout which handles auth logic
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={DarkTheme}>
        <InitialLayout />
        <Toast />
        {/* Drawer positioned at the root level, state from Zustand */}
        <Drawer
          isVisible={isDrawerVisible}
          onClose={closeDrawer} // closeDrawer action from Zustand store
          maxHeight={drawerMaxHeight}
          minHeight={drawerMinHeight}
          colors={Colors} // Pass colors if your Drawer uses them
        >
          {drawerContent}
        </Drawer>
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
