import React, { useEffect, useState, useCallback } from 'react'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as Updates from 'expo-updates'
import 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, View, ActivityIndicator, Platform, Text } from 'react-native'
import { setAppTheme } from '@team556/ui'
import { Colors } from '../constants/Colors'
import { useAuthStore } from '@/store/authStore'
import Toast from '@/components/Toast'
import { Drawer } from '@team556/ui'
import { useDrawerStore } from '@/store/drawerStore'

// Configure shared UI components to use the app's colors
setAppTheme(Colors)

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

function InitialLayout() {
    const { isUpdatePending } = Updates.useUpdates()
  const [isShowingUpdate, setIsShowingUpdate] = useState(false)

    useEffect(() => {
    if (isUpdatePending) {
      setIsShowingUpdate(true);
      // Wait for 1 second before reloading to show the updating view
      setTimeout(() => {
        Updates.reloadAsync();
      }, 1000);
    }
  }, [isUpdatePending]);

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
    const inLogin = currentSegment === 'login'
    const allowedStandaloneRoutes = ['privacy', 'terms', 'signin', 'signup', 'auth'] // Explicitly allow these
    // Check if the current route is in the allowed standalone routes or is a subdirectory of them
    const inAllowedStandalone = allowedStandaloneRoutes.includes(currentSegment) || 
      (segments.length > 1 && allowedStandaloneRoutes.includes(segments[0]))

    if (isAuthenticated) {
      if (user) {
        if (!inAuthGroup && !inAllowedStandalone) {
          router.replace('/(tabs)/' as any)
        }
      }
    } else {
      if (!inLogin && !inAllowedStandalone) {
        router.replace('/login')
      }
    }
    // Add router to dependency array as it's used inside the effect
  }, [isAuthenticated, isLoading, user, segments, router])

  // While loading the auth state, show a loading indicator or splash screen
  if (isShowingUpdate) {
    return <UpdatingView />;
  }

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
      <Stack.Screen name='login' options={{ headerShown: false, title: 'Login - Team556 Wallet' }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false, title: 'Team556 Wallet' }} />
      <Stack.Screen name='privacy' options={{ headerShown: false, title: 'Privacy Policy - Team556 Wallet' }} />
      <Stack.Screen name='terms' options={{ headerShown: false, title: 'Terms of Service - Team556 Wallet' }} />
      <Stack.Screen name='auth/ForgotPasswordScreen' options={{ headerShown: false, title: 'Forgot Password - Team556 Wallet' }} />
      <Stack.Screen name='auth/ResetPasswordScreen' options={{ headerShown: false, title: 'Reset Password - Team556 Wallet' }} />
      <Stack.Screen name='+not-found' options={{ title: 'Page Not Found - Team556 Wallet' }} />
      <Stack.Screen name='signin' options={{ headerShown: false, title: 'Sign In - Team556 Wallet' }} />
      <Stack.Screen name='signup' options={{ headerShown: false, title: 'Sign Up - Team556 Wallet' }} />
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

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
