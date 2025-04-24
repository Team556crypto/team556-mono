import React, { useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { Text, StepForm } from '@team556/ui'
import { createWallet } from '@/services/api'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/Colors'

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedSaved, setConfirmedSaved] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const token = useAuthStore(state => state.token)
  const fetchAndUpdateUser = useAuthStore(state => state.fetchAndUpdateUser)

  const handleCreateWallet = async () => {
    setIsLoading(true)
    setError(null)
    if (!token) {
      setError('Authentication token not found. Please log in again.')
      setIsLoading(false)
      return
    }
    try {
      const response = await createWallet(token)
      setMnemonic(response.mnemonic)
      setCurrentStep(1)
    } catch (err: any) {
      console.error('Failed to create wallet:', err)
      setError(err.message || 'Failed to create wallet. Please try again.')
      Alert.alert('Error', err.message || 'Failed to create wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic)
      Alert.alert('Copied!', 'Recovery phrase copied to clipboard.')
    }
  }

  const handleComplete = async () => {
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
  }

  const toggleConfirmation = () => setConfirmedSaved(!confirmedSaved)

  const steps = [
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <StepForm
        steps={steps}
        currentStep={currentStep}
        onNextStep={currentStep === 0 ? handleCreateWallet : undefined} // Trigger create on step 0 'Next'
        onComplete={handleComplete} // Use the combined handler for completion
        nextButtonText={currentStep === 0 ? (isLoading ? 'Creating...' : 'Create Wallet') : 'Next'} // Dynamic text for step 0
        completeButtonText={currentStep === 0 ? 'Continue' : 'Finish'}
        hidePreviousButton={true} // Hide 'Back' on step 1
        disableNextButton={isLoading || (currentStep === 1 && !confirmedSaved)} // Disable during load OR if not confirmed on step 2
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  stepContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22
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
  mnemonicCard: {
    marginTop: 20,
    padding: 15,
    width: '100%',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2
  },
  mnemonicLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10
  },
  mnemonicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    minHeight: 60
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
  }
})
