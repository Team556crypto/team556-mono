import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, TouchableOpacity, Platform, SafeAreaView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Text, Input, Button } from '@repo/ui'
import { resetPassword } from '../../services/api/auth'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { genericStyles } from '@/constants/GenericStyles'

const ResetPasswordScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { isTabletOrLarger } = useBreakpoint()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (params.email && typeof params.email === 'string') {
      setEmail(params.email)
    }
  }, [params.email])

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.')
      return
    }
    if (!email) {
      Alert.alert('Error', 'Email address is missing. Please go back and try again.')
      // Potentially navigate back or guide user
      return
    }

    setIsLoading(true)
    setMessage('')
    try {
      const response = await resetPassword({
        email,
        code,
        new_password: newPassword
      })
      Alert.alert('Success', response.message)
      router.replace('/login') // Or your main login route
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error.message || 'Failed to reset password. Please try again.'
      Alert.alert('Error', errorMessage)
      setMessage(errorMessage)
      console.error('Reset Password Error:', error.response?.data || error)
    } finally {
      setIsLoading(false)
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
              Reset Your Password
            </Text>
            <Text style={styles.subtitle}>Enter the code sent to {email || 'your email'} and your new password.</Text>
          </View>

          <Input
            placeholder='Verification Code'
            value={code}
            onChangeText={setCode}
            keyboardType='numeric'
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textTertiary}
          />
          <Input
            placeholder='New Password'
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textTertiary}
          />
          <Input
            placeholder='Confirm New Password'
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input, isTabletOrLarger && styles.inputDesktop]}
            placeholderTextColor={Colors.textTertiary}
          />
          {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
          <Button
            title={isLoading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
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
    borderColor: Colors.primarySubtle,
    borderWidth: 1,
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

export default ResetPasswordScreen
