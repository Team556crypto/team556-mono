import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions, // Import useWindowDimensions
  Platform
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Button, Input, Text } from '@team556/ui'
import { genericStyles } from '@/constants/GenericStyles'
import LogoSvg from '@/assets/images/logo.svg'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/Colors'

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Define a breakpoint for larger screens
const TABLET_BREAKPOINT = 768 // Pixels

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, signup, isLoading, error, setError } = useAuthStore()
  const { width } = useWindowDimensions() // Get screen width

  // Determine if the screen is tablet-sized or larger
  const isTabletOrLarger = width >= TABLET_BREAKPOINT

  // --- Validation and Handler functions (keep as is) ---
  const validateInput = (isSignUp: boolean = false): boolean => {
    // ... (validation logic remains the same)
    if (!email) {
      setError('Email is required.')
      return false
    }
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.')
      return false
    }
    if (!password) {
      setError('Password is required.')
      return false
    }
    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters long for sign up.') // Add specific error
      return false
    }
    setError(null) // Clear error if validation passes this point
    return true
  }

  const handleSignIn = async () => {
    if (!validateInput(false)) return
    setError(null)
    try {
      await login({ email, password })
    } catch (err: any) {
      console.error('Login failed in component:', err)
      // Ensure error state is updated even if caught here
      if (!error) setError('Login failed. Please try again.')
    }
  }

  const handleSignUp = async () => {
    if (!validateInput(true)) return
    setError(null)
    try {
      await signup({ email, password })
    } catch (err: any) {
      console.error('Signup failed in component:', err)
      if (!error) setError('Signup failed. Please try again.')
    }
  }

  useEffect(() => {
    return () => {
      setError(null)
    }
  }, [setError])
  // --- End Validation and Handlers ---

  // --- Define dynamic styles ---
  const dynamicStyles = getDynamicStyles(isTabletOrLarger)

  return (
    // Apply conditional container style
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.content, dynamicStyles.content]}>
        <LogoSvg width={170} height={170} style={styles.logo} />
        <Input
          placeholder='Email'
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
          // Apply conditional input style if needed, e.g., for width
          style={[genericStyles.input, dynamicStyles.input]}
          editable={!isLoading}
          leftIcon={<MaterialIcons name='mail-outline' size={22} color={Colors.text} />}
        />
        <Input
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[genericStyles.input, dynamicStyles.input]}
          editable={!isLoading}
          leftIcon={<MaterialIcons name='lock-outline' size={22} color={Colors.text} />}
        />

        {isLoading && <ActivityIndicator size='large' color='#ccc' style={styles.loader} />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Apply conditional button container style */}
        <View style={[styles.buttonContainer, dynamicStyles.buttonContainer]}>
          <Button
            title='Sign In'
            onPress={handleSignIn}
            // Apply conditional button style
            style={[genericStyles.button, dynamicStyles.signInButton]}
            disabled={isLoading || !email.length || !password.length}
          />
          <Button
            title='Sign Up'
            variant='ghost'
            onPress={handleSignUp}
            // Apply conditional button style
            style={[styles.signUpButtonBase, dynamicStyles.signUpButton]}
            disabled={isLoading || !email.length || !password.length}
          />
        </View>
      </View>
    </View>
  )
}

// --- Base Styles ---
const styles = StyleSheet.create({
  container: {
    ...genericStyles.container,
    flex: 1, // Ensure it takes full height
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%' // Ensure it takes full width initially
  },
  content: {
    width: '100%',
    alignItems: 'center' // Center content horizontally
  },
  logo: {
    marginBottom: 40 // Increased margin slightly
  },
  loader: {
    marginVertical: 15
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
    minHeight: 20, // Keep space even if no error
    width: '100%' // Ensure text wraps within container width
  },
  buttonContainer: {
    marginTop: 20, // Increased margin slightly
    width: '100%', // Base width
    alignItems: 'center' // Center buttons vertically stacked
  },
  // Base style for sign-up button, separate from dynamic overrides
  signUpButtonBase: {
    ...genericStyles.button, // Inherit base button styles if needed from genericStyles
    marginTop: 10 // Spacing when stacked vertically
  }
})

// --- Function to get dynamic styles based on screen size ---
const getDynamicStyles = (isTabletOrLarger: boolean) => {
  if (isTabletOrLarger) {
    // Styles for Tablet and Larger Screens
    return StyleSheet.create({
      container: {
        alignSelf: 'center' // Center the container itself
      },
      input: {},
      content: {
        maxWidth: 380 // Limit max width on large screens
      },
      buttonContainer: {
        flexDirection: 'row', // Arrange buttons side-by-side
        justifyContent: 'space-between', // Space them out
        gap: 20, // Add gap between buttons
        marginTop: 30 // Adjust top margin for row layout
      },
      signInButton: {
        flex: 1, // Make buttons share space equally
        marginHorizontal: 0, // Reset horizontal margin if genericStyles.button has it
        marginTop: 0 // Reset top margin
      },
      signUpButton: {
        flex: 1, // Make buttons share space equally
        marginHorizontal: 0, // Reset horizontal margin
        marginTop: 0 // Reset top margin (was 10 in stacked layout)
        // Add any specific style overrides for ghost button in row layout if needed
      }
    })
  } else {
    // Styles for Mobile (essentially no overrides needed if base styles are mobile-first)
    // Return empty styles or specific mobile overrides if base wasn't mobile-first
    return StyleSheet.create({
      container: {},
      input: {},
      content: {},
      buttonContainer: {},
      signInButton: {}, // Reference generic style
      signUpButton: {
        // Reference base style for vertical layout
        marginTop: styles.signUpButtonBase.marginTop
      }
    })
  }
}
