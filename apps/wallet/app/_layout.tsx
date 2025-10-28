import React, { useEffect, useState, useCallback } from 'react'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as Updates from 'expo-updates'
import 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, View, ActivityIndicator, Platform, Text, LogBox } from 'react-native'
import { setAppTheme } from '@team556/ui'
import { Colors } from '../constants/Colors'
import { useAuthStore } from '@/store/authStore'
import Toast from '@/components/Toast'
import { Drawer } from '@team556/ui'
import { useDrawerStore } from '@/store/drawerStore'

// Configure shared UI components to use the app's colors
setAppTheme(Colors)

// Suppress React Native LogBox overlays (e.g., bottom error banners in dev)
// We still keep console.error logs in the terminal/Metro, but prevent UI popups.
LogBox.ignoreAllLogs(true)

// --- BEGIN: Web Overscroll Prevention --- 
const preventWebOverscroll = () => {
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        overscroll-behavior: none !important;
      }
    `;
    document.head.append(style);
  }
};
// --- END: Web Overscroll Prevention --- 

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const UpdatingView = () => (
  <View style={styles.updatingContainer}>
    <ActivityIndicator size="large" color="#FFFFFF" />
    <Text style={styles.updatingText}>Updating...</Text>
  </View>
);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

  const { isUpdatePending } = Updates.useUpdates()
  const [isShowingUpdate, setIsShowingUpdate] = useState(false)

  useEffect(() => {
    if (isUpdatePending) {
      setIsShowingUpdate(true);
      setTimeout(() => {
        Updates.reloadAsync();
      }, 1000);
    }
  }, [isUpdatePending]);

  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

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
    const allowedStandaloneRoutes = ['privacy', 'terms', 'signin', 'signup', 'auth'] // Explicitly allow these
    // Check if the current route is in the allowed standalone routes or is a subdirectory of them
    const inAllowedStandalone = allowedStandaloneRoutes.includes(currentSegment) || 
      (segments.length > 1 && allowedStandaloneRoutes.includes(segments[0]))

    if (isAuthenticated) {
      // Ensure user object is loaded before checking verification or wallets
      if (user) {
        // Check email verification status FIRST
        if (!user.email_verified) {
          // User's email is not verified, must go to onboarding
          if (!inOnboarding) {
            router.replace('/onboarding')
          }
        } else {
          // Email is verified, proceed with wallet check
          const hasWallets = user.wallets && user.wallets.length > 0

          if (hasWallets) {
            // Verified user with wallets. Should be in tabs or allowed standalone.
            if (!inAuthGroup && !inAllowedStandalone) {
              router.replace('/(tabs)/' as any)
            }
          } else {
            // Verified user has no wallets, should be in onboarding
            if (!inOnboarding) {
              router.replace('/onboarding')
            }
          }
        }
      }
    } else {
      // Not authenticated
      // Redirect to login if not already there or on another allowed standalone route
      if (!inLogin && !inAllowedStandalone) {
        router.replace('/login')
      }
    }
    // Add router to dependency array as it's used inside the effect
  }, [isAuthenticated, isLoading, user, segments, router])

  // --- BEGIN: Call Web Overscroll Prevention --- 
  useEffect(() => {
    preventWebOverscroll();
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- END: Call Web Overscroll Prevention --- 

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

  // While loading fonts or updates, show a loading indicator
  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.tint} />
      </View>
    )
  }

  if (isShowingUpdate) {
    return <UpdatingView />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.tint} />
      </View>
    )
  }

  // Render the main stack navigator with drawer and toast
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name='login' options={{ title: 'Login - Team556 Wallet' }} />
        <Stack.Screen name='(tabs)' options={{ title: 'Team556 Wallet' }} />
        <Stack.Screen name='onboarding' options={{ title: 'Onboarding - Team556 Wallet' }} />
        <Stack.Screen name='privacy' options={{ title: 'Privacy Policy - Team556 Wallet' }} />
        <Stack.Screen name='terms' options={{ title: 'Terms of Service - Team556 Wallet' }} />
        <Stack.Screen name='auth/ForgotPasswordScreen' options={{ title: 'Forgot Password - Team556 Wallet' }} />
        <Stack.Screen name='auth/ResetPasswordScreen' options={{ title: 'Reset Password - Team556 Wallet' }} />
        <Stack.Screen name='+not-found' options={{ title: 'Page Not Found - Team556 Wallet' }} />
        <Stack.Screen name='signin' options={{ title: 'Sign In - Team556 Wallet' }} />
        <Stack.Screen name='signup' options={{ title: 'Sign Up - Team556 Wallet' }} />
      </Stack>
      <Toast />
      <Drawer
        isVisible={isDrawerVisible}
        onClose={closeDrawer}
        maxHeight={drawerMaxHeight}
        minHeight={drawerMinHeight}
        colors={Colors}
      >
        {drawerContent}
      </Drawer>
      <StatusBar style='light' />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  updatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  updatingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.backgroundDarkest // Use app's background color
  },
  container: {
    flex: 1,
  }
})
