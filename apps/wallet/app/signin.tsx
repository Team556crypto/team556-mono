import React, { useState } from 'react'
import { View, StyleSheet, Alert, SafeAreaView, Platform, TouchableOpacity } from 'react-native'
import { Button, Input, Text } from '@repo/ui'
import { useRouter } from 'expo-router'
import { genericStyles } from '@/constants/GenericStyles'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import LogoSvg from '@/assets/images/logo.svg';

const SignInScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { isTabletOrLarger } = useBreakpoint()
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthStore()

  const handleSignIn = async () => {
    setAuthError(null)
    try {
      await login({ email, password })
      // Navigation is handled by the root _layout based on auth state
    } catch (err) {
      console.error("Sign in failed in component:", err)
      // Optionally show a generic alert or rely on the displayed authError
      // Alert.alert('Sign In Failed', authError || 'An unknown error occurred')
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
            <LogoSvg width={60} height={60} style={styles.logo} />
            <Text preset='h1'>Sign In</Text>
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
          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleSignIn}
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
    backgroundColor: Colors.backgroundDarkest
  },
  outerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center'
  },
  logo: {
    marginBottom: 15,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  contentContainerDesktop: {
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 40
  },
  container: {
    // This style might be redundant now, check if needed
    // padding: 20,
  },
  input: {
    width: '100%'
  },
  inputDesktop: {
    height: 56,
    fontSize: 16,
    minWidth: 400
  },
  button: {
    marginTop: 20
  },
  buttonDesktop: {
    height: 56,
    marginTop: 30
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
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjust based on OS status bar
    left: 20,
    zIndex: 1, // Ensure it's above other content
    padding: 10 // Make tap area larger
  },
})

export default SignInScreen
