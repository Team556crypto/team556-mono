import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Button, Input, Text } from '@team556/ui'
import { genericStyles } from '@/constants/GenericStyles'
import LogoSvg from '@/assets/images/logo.svg'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/Colors'

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, signup, isLoading, error, setError } = useAuthStore()

  const validateInput = (isSignUp: boolean = false): boolean => {
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
    // Only check password length on Sign Up, as per backend rules
    if (isSignUp && password.length < 8) {
      return false
    }
    return true
  }

  const handleSignIn = async () => {
    // Use validation function (isSignUp = false)
    if (!validateInput(false)) {
      return
    }
    // Validation passed, clear any potential previous error *before* calling login
    setError(null)
    try {
      await login({ email, password })
    } catch (err: any) {
      console.error('Login failed in component:', err)
    }
  }

  const handleSignUp = async () => {
    // Use validation function (isSignUp = true)
    if (!validateInput(true)) {
      return
    }
    // Validation passed, clear any potential previous error *before* calling signup
    setError(null)
    try {
      await signup({ email, password })
    } catch (err: any) {
      console.error('Signup failed in component:', err)
    }
  }

  useEffect(() => {
    // Clear errors when component unmounts
    return () => {
      setError(null)
    }
  }, [setError])

  return (
    <View style={styles.container}>
      <LogoSvg width={170} height={170} style={styles.logo} />
      <Input
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
        keyboardType='email-address'
        style={genericStyles.input}
        editable={!isLoading}
        leftIcon={<MaterialIcons name='mail-outline' size={22} color={Colors.text} />}
      />
      <Input
        placeholder='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={genericStyles.input}
        editable={!isLoading}
        leftIcon={<MaterialIcons name='lock-outline' size={22} color={Colors.text} />}
      />

      {isLoading && <ActivityIndicator size='large' color='#ccc' style={styles.loader} />}

      {/* Display error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          title='Sign In'
          onPress={handleSignIn}
          style={genericStyles.button}
          disabled={isLoading || !email.length || !password.length}
        />
        <Button
          title='Sign Up'
          variant='ghost'
          onPress={handleSignUp}
          style={styles.signUpButton}
          disabled={isLoading || !email.length || !password.length}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...genericStyles.container,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  logo: {
    marginBottom: 20
  },
  loader: {
    marginVertical: 15
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
    minHeight: 20
  },
  buttonContainer: {
    marginTop: 15,
    width: '100%'
  },
  signUpButton: {
    ...genericStyles.button,
    marginTop: 6
  }
})
