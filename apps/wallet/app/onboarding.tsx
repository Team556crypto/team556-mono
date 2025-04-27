import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView
} from 'react-native'
import { Text, StepForm, Input } from '@team556/ui'
import { createWallet, verifyEmail, resendVerificationEmail } from '@/services/api'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/Colors'
import { genericStyles } from '@/constants/GenericStyles'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function OnboardingScreen() {
  const { isTabletOrLarger } = useBreakpoint()
  const [currentStep, setCurrentStep] = useState(0)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedSaved, setConfirmedSaved] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)

  // Add state for email verification
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Add state for resending email
  const [isResending, setIsResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const token = useAuthStore(state => state.token)
  const fetchAndUpdateUser = useAuthStore(state => state.fetchAndUpdateUser)

  // Timer effect for cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1)
      }, 1000)
    } else if (timer) {
      clearInterval(timer)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCooldown])

  // Handler for submitting the verification code
  const handleVerifyEmail = useCallback(async () => {
    if (!token) {
      setVerificationError('Authentication required. Please login again.')
      return
    }
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code.')
      return
    }

    setIsVerifying(true)
    setVerificationError(null)

    try {
      await verifyEmail(token, verificationCode)
      await fetchAndUpdateUser()
      setCurrentStep(prev => prev + 1)
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || err.message || 'Failed to verify email. Please check the code and try again.'
      setVerificationError(errorMessage)
      Alert.alert('Verification Failed', errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }, [verificationCode, token, fetchAndUpdateUser])

  // Handler for resending verification email
  const handleResendVerification = useCallback(async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccessMessage(null)

    try {
      const response = await resendVerificationEmail(token)
      if (response.message === 'Verification email resent successfully') {
        setResendSuccessMessage('New verification email sent!')
        setResendCooldown(60) // Start 60-second cooldown
      } else {
        setResendSuccessMessage(response.message || 'Verification status updated.')
      }
    } catch (err: any) {
      console.error('Resend Verification API error:', err)
      const errorMessage = err?.response?.data?.error || err.message || 'An unknown error occurred while resending.'
      setResendError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }, [token])

  const handleCreateWallet = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const token = useAuthStore.getState().token

    if (!token) {
      setError('Authentication required. Please login again.')
      setIsLoading(false)
      return
    }

    try {
      const response = await createWallet(token)
      setMnemonic(response.mnemonic)
      setCurrentStep(prev => prev + 1)
    } catch (err: any) {
      console.error('Failed to create wallet:', err)
      setError(err.message || 'Failed to create wallet. Please try again.')
      Alert.alert('Error', err.message || 'Failed to create wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const handleCopyToClipboard = useCallback(async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic)
      Alert.alert('Copied!', 'Recovery phrase copied to clipboard.')
    }
  }, [mnemonic])

  const handleComplete = useCallback(async () => {
    if (!confirmedSaved) {
      Alert.alert('Confirmation Required', 'Please confirm you have securely saved your recovery phrase.')
      return
    }
    try {
      await fetchAndUpdateUser()
      router.replace('/(tabs)/' as any)
    } catch (error) {
      console.error('Error updating user before navigation:', error)
      router.replace('/(tabs)/' as any)
    }
  }, [confirmedSaved, fetchAndUpdateUser])

  const toggleConfirmation = useCallback(() => setConfirmedSaved(!confirmedSaved), [])

  const steps = [
    {
      title: 'Verify Email',
      content: (
        <View style={styles.stepContentContainer}>
          <Text style={styles.description}>Please enter the 6-digit verification code sent to your email.</Text>
          <Input
            placeholder='Verification Code'
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType='numeric'
            maxLength={6}
            style={styles.input}
          />
          {isVerifying && <ActivityIndicator size='large' color={Colors.tint} style={styles.loader} />}
          {verificationError && !isVerifying && <Text style={styles.errorText}>{verificationError}</Text>}
          <View style={styles.resendContainer}>
            <Pressable
              onPress={handleResendVerification}
              style={[styles.resendButton, isResending || resendCooldown > 0 ? styles.disabledButton : {}]}
              disabled={isResending || resendCooldown > 0}
            >
              <Text style={styles.resendButtonText}>
                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email'}
              </Text>
            </Pressable>
            {resendError && <Text style={[styles.errorText, styles.resendMessage]}>{resendError}</Text>}
            {resendSuccessMessage && (
              <Text style={[styles.successText, styles.resendMessage]}>{resendSuccessMessage}</Text>
            )}
          </View>
        </View>
      )
    },
    {
      title: 'Create Wallet',
      content: (
        <View style={styles.stepContentContainer}>
          <Text style={styles.description}>
            Let's set up your secure Solana wallet. You'll receive a unique recovery phrase.
          </Text>
          <Text style={[styles.description, styles.warning]}>
            IMPORTANT: Write this phrase down and store it somewhere safe. It's the ONLY way to recover your wallet if
            you lose access. Do NOT share it with anyone.
          </Text>
          {isLoading && <ActivityIndicator size='large' color={Colors.tint} style={styles.loader} />}
          {error && !isLoading && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )
    },
    {
      title: 'Save Recovery Phrase',
      content: (
        <View style={styles.stepContentContainer}>
          <Text style={styles.description}>
            Your wallet has been created. Please save your recovery phrase securely.
          </Text>
          {mnemonic && (
            <View style={styles.mnemonicCard}>
              <Text style={styles.mnemonicLabel}>Your Recovery Phrase:</Text>
              <View style={styles.mnemonicContainer}>
                <Text style={styles.mnemonicText}>{showMnemonic ? mnemonic : '•••••••••••••••••••••••••••••••••'}</Text>
                <Pressable onPress={() => setShowMnemonic(!showMnemonic)} style={styles.iconButton}>
                  <Ionicons name={showMnemonic ? 'eye-off-outline' : 'eye-outline'} size={24} color={'#888'} />
                </Pressable>
                <Pressable onPress={handleCopyToClipboard} style={styles.iconButton}>
                  <Ionicons name='copy-outline' size={24} color={'#888'} />
                </Pressable>
              </View>

              <Pressable onPress={toggleConfirmation} style={styles.confirmationContainer}>
                <Ionicons
                  name={confirmedSaved ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={confirmedSaved ? Colors.success : '#888'} // Use #888 for unchecked icon
                />
                <Text style={styles.confirmationText}>I have securely saved my recovery phrase.</Text>
              </Pressable>
            </View>
          )}
        </View>
      )
    }
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <StepForm
        steps={steps}
        currentStep={currentStep}
        // Call verify for step 0, create for step 1
        onNextStep={currentStep === 0 ? handleVerifyEmail : currentStep === 1 ? handleCreateWallet : undefined}
        onComplete={handleComplete} // Called on the final step
        // Dynamic button text based on current step
        nextButtonText={
          currentStep === 0
            ? isVerifying
              ? 'Verifying...'
              : 'Verify Email'
            : currentStep === 1
              ? isLoading
                ? 'Creating...'
                : 'Create Wallet'
              : 'Next' // Default 'Next' for the last step (though 'Finish' is usually shown)
        }
        completeButtonText={'Finish'} // Show 'Finish' only on the last step (step 2)
        hidePreviousButton={true} // Keep hidden for step 1 and 2
        // Disable logic based on current step and loading states
        disableNextButton={
          (currentStep === 0 && (isVerifying || verificationCode.length !== 6)) ||
          (currentStep === 1 && isLoading) ||
          (currentStep === 2 && !confirmedSaved)
        }
        style={isTabletOrLarger ? styles.stepFormTablet : styles.stepForm}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  stepForm: {
    flex: 1
  },
  stepFormTablet: {
    flex: 1,
    maxWidth: 600,
    maxHeight: 600,
    alignSelf: 'center',
    marginHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden'
  },
  stepContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flex: 1,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 22,
    width: '100%'
  },
  warning: {
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 25
  },
  loader: {
    marginVertical: 20,
    marginTop: 40
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginVertical: 15,
    minHeight: 20,
    marginTop: 40
  },
  input: {
    ...genericStyles.input,
    width: '80%'
  },
  mnemonicCard: {
    marginTop: 20,
    padding: 15,
    width: '100%',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  mnemonicLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10
  },
  mnemonicContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    width: '100%'
  },
  mnemonicText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    lineHeight: 24,
    marginRight: 10,
    color: Colors.text
  },
  iconButton: {
    padding: 5,
    marginLeft: 5
  },
  confirmationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
    alignSelf: 'flex-start'
  },
  confirmationText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.text
  },
  resendContainer: {
    marginTop: 25,
    alignItems: 'center'
  },
  resendButton: {
    minWidth: 150,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.tint,
    alignItems: 'center'
  },
  resendButtonText: {
    fontSize: 16,
    color: '#fff'
  },
  disabledButton: {
    opacity: 0.5
  },
  resendMessage: {
    marginTop: 10,
    textAlign: 'center'
  },
  successText: {
    color: Colors.success
  }
})
