import React, { useState } from 'react'
import { View, StyleSheet, Alert, SafeAreaView, Platform, TouchableOpacity } from 'react-native'
import { Button, Input, Text } from '@repo/ui'
import { useRouter } from 'expo-router'
import { genericStyles } from '@/constants/GenericStyles'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'

const SignUpScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { isTabletOrLarger } = useBreakpoint()
  const { signup, isLoading, error: authError, setError: setAuthError } = useAuthStore()
  const router = useRouter()

  const handleSignUp = async () => {
    setAuthError(null)
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }
    try {
      await signup({ email, password })
      // Navigation is handled by the root _layout based on auth state
    } catch (err) {
      // Error is set in the store
      console.error("Sign up failed in component:", err)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <View style={styles.outerContainer}>
        {/* Form Content Centered */}
        <View style={[styles.contentContainer, isTabletOrLarger && styles.contentContainerDesktop]}>
          {/* Simple Header */}
          <View style={styles.headerContainer}>
            <Text preset='h1'>Create Account</Text>
          </View>
          {/* Display Auth Error */}
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          <Input
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='mail-outline' size={20} color={Colors.icon} />}
          />
          <Input
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
          />
          <Input
            placeholder='Confirm Password'
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
          />
          <Button
            title={isLoading ? 'Creating Account...' : 'Sign Up'}
            onPress={handleSignUp}
            style={[styles.button, isTabletOrLarger && styles.buttonDesktop]}
            disabled={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest // Match ScreenLayout background
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjust based on OS status bar
    left: 20,
    zIndex: 1, // Ensure it's above other content
    padding: 10 // Make tap area larger
  },
  outerContainer: {
    flex: 1,
    paddingHorizontal: 20, // Add horizontal padding
    paddingTop: 20 // Add some top padding
  },
  headerContainer: {
    marginBottom: 20, // Reduced space below header slightly
    alignItems: 'center' // Center title
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40 // Add some padding at the bottom
  },
  contentContainerDesktop: {
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 40
  },
  container: {
    // This style might be redundant now, check if needed
    // padding: 20, // Moved padding to outerContainer
  },
  input: {
    width: '100%' // Make inputs take full width
  },
  inputDesktop: {
    height: 56, // Slightly larger input for desktop
    fontSize: 16, // Larger font size
    minWidth: 400 // Set minimum width for desktop
  },
  button: {
    marginTop: 20
  },
  buttonDesktop: {
    height: 56, // Taller button for desktop
    marginTop: 30 // More space above button
  },
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
    alignItems: 'center'
  },
  errorText: {
    color: Colors.errorText,
    textAlign: 'center'
  }
})

export default SignUpScreen
