import React, { useState } from 'react'
import { View, StyleSheet, Alert, TouchableOpacity, Platform, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Input, Button } from '@repo/ui'
import { requestPasswordReset } from '../../services/api/auth'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { genericStyles } from '@/constants/GenericStyles'

const ForgotPasswordScreen = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { isTabletOrLarger } = useBreakpoint()

  const handleSendResetCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.')
      return
    }
    setIsLoading(true)
    setMessage('')
    try {
      const response = await requestPasswordReset(email)
      Alert.alert('Check Your Email', response.message)
      router.push({ pathname: '/auth/ResetPasswordScreen', params: { email } })
    } catch (error: any) {
      setIsLoading(false)
      const errorMessage =
        error?.response?.data?.message || error.message || 'Failed to request password reset. Please try again.'
      Alert.alert('Error', errorMessage)
      setMessage(errorMessage)
      console.error('Forgot Password Error:', error.response?.data || error)
    } finally {
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name='arrow-back' size={24} color={Colors.text} />
      </TouchableOpacity>
      <View style={styles.outerContainer}>
        <View style={[styles.contentContainer, isTabletOrLarger && styles.contentContainerDesktop]}>
          <View style={styles.headerContainer}>
            <Text preset='h2' style={styles.title}>
              Forgot Password?
            </Text>
            <Text style={styles.subtitle}>
              Enter your email address below and we'll send you a code to reset your password.
            </Text>
          </View>

          <Input
            placeholder='Enter your email'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textTertiary}
          />
          {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
          <Button
            title={isLoading ? 'Sending...' : 'Send Reset Code'}
            onPress={handleSendResetCode}
            disabled={isLoading}
            style={[styles.button, isTabletOrLarger && styles.buttonDesktop]}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarker
  },
  outerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center'
  },
  contentContainer: {
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  contentContainerDesktop: {
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 12,
    backgroundColor: Colors.background
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: Colors.text
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.textSecondary
  },
  input: {
    height: 50,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 5,
    color: Colors.text,
    width: '100%'
  },
  inputDesktop: {
    height: 56,
    fontSize: 16
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10
  },
  buttonDesktop: {
    height: 56,
    marginTop: 20
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1,
    padding: 10
  },
  errorMessage: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10
  }
})

export default ForgotPasswordScreen
