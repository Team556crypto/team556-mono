import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Button, Input, Text } from '@team556/ui'
import { genericStyles } from '@/constants/GenericStyles'
import LogoSvg from '@/assets/images/logo.svg'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, signup, isLoading, error, setError } = useAuthStore()
  const { isTabletOrLarger } = useBreakpoint()

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
    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters long for sign up.')
      return false
    }
    setError(null)
    return true
  }

  const handleSignIn = async () => {
    if (!validateInput(false)) return
    setError(null)
    try {
      await login({ email, password })
    } catch (err: any) {
      if (!error) setError('Login failed. Please try again.')
    }
  }

  const handleSignUp = async () => {
    if (!validateInput(true)) return
    setError(null)
    try {
      await signup({ email, password })
    } catch (err: any) {
      if (!error) setError('Signup failed. Please try again.')
    }
  }

  useEffect(() => {
    return () => {
      setError(null)
    }
  }, [setError])

  return (
    <View style={[styles.container, isTabletOrLarger && styles.containerTablet]}>
      <View style={[styles.content, isTabletOrLarger && styles.contentTablet]}>
        <LogoSvg width={170} height={170} style={styles.logo} />
        <Input
          placeholder='Email'
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
          style={[genericStyles.input]}
          editable={!isLoading}
          leftIcon={<MaterialIcons name='mail-outline' size={22} color={Colors.text} />}
        />
        <Input
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[genericStyles.input]}
          editable={!isLoading}
          leftIcon={<MaterialIcons name='lock-outline' size={22} color={Colors.text} />}
        />

        {isLoading && <ActivityIndicator size='large' color='#ccc' style={styles.loader} />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={[styles.buttonContainer, isTabletOrLarger && styles.buttonContainerTablet]}>
          <Button
            title='Sign In'
            onPress={handleSignIn}
            style={[genericStyles.button, isTabletOrLarger && styles.signInButtonTablet]}
            disabled={isLoading || !email.length || !password.length}
            fullWidth={!isTabletOrLarger}
          />
          <Button
            title='Sign Up'
            variant='ghost'
            onPress={handleSignUp}
            style={[styles.signUpButtonBase, isTabletOrLarger && styles.signUpButtonTablet]}
            disabled={isLoading || !email.length || !password.length}
            fullWidth={!isTabletOrLarger}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...genericStyles.container,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%'
  },
  containerTablet: {},
  content: {
    width: '100%',
    alignItems: 'center'
  },
  contentTablet: {
    maxWidth: 380
  },
  logo: {
    marginBottom: 40
  },
  loader: {
    marginVertical: 15
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
    minHeight: 20,
    width: '100%'
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center'
  },
  buttonContainerTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 30
  },
  signUpButtonBase: {
    ...genericStyles.button,
    marginTop: 10
  },
  signUpButtonTablet: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0
  },
  signInButtonTablet: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0
  }
})
