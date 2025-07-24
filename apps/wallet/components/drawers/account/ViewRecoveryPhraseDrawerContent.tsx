import React, { useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Button, Input, Text } from '@team556/ui'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useAuthStore } from '@/store/authStore'
import { getRecoveryPhrase, GetRecoveryPhraseRequest } from '@/services/api'
import { Colors } from '@/constants/Colors'
import { genericStyles } from '@/constants/GenericStyles'

interface ViewRecoveryPhraseDrawerContentProps {
  onClose: () => void
}

const ViewRecoveryPhraseDrawerContent: React.FC<ViewRecoveryPhraseDrawerContentProps> = ({ onClose }) => {
  const { token } = useAuthStore()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedPhrase, setRevealedPhrase] = useState<string | null>(null)
  const [isPhraseVisible, setIsPhraseVisible] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const resetState = useCallback(() => {
    setPassword('')
    setIsLoading(false)
    setError(null)
    setRevealedPhrase(null)
    setIsPhraseVisible(false)
    setCopySuccess(false)
  }, [])

  const handleCloseAndReset = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleRevealPhrase = useCallback(async () => {
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setIsLoading(true)
    setError(null)
    setCopySuccess(false)

    const requestData: GetRecoveryPhraseRequest = { password }

    try {
      const response = await getRecoveryPhrase(requestData, token)
      if (response.recoveryPhrase) {
        setRevealedPhrase(response.recoveryPhrase)
        setIsPhraseVisible(true)
      } else {
        setError(response.error || 'Failed to retrieve recovery phrase. Please check your password.')
      }
    } catch (apiError: any) {
      setError(apiError.message || 'An unexpected error occurred.')
    }
    setIsLoading(false)
  }, [password, token])

  const handleCopyToClipboard = async () => {
    if (revealedPhrase) {
      await Clipboard.setStringAsync(revealedPhrase)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleAcknowledge = () => {
    Alert.alert(
      'Security Confirmation',
      'I understand that I should never share my recovery phrase with anyone and have stored it securely.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'I Understand',
          onPress: handleCloseAndReset,
          style: 'destructive'
        }
      ]
    )
  }

  if (revealedPhrase && isPhraseVisible) {
    const words = revealedPhrase.split(' ')
    return (
      <View style={styles.sheetContentContainer}>
        <Text preset='h4' style={styles.sheetTitle}>
          Your Recovery Phrase
        </Text>
        <Text preset='caption' style={styles.warningText}>
          Write down these words in order and keep them somewhere safe. Anyone with this phrase can access your wallet.
        </Text>
        <View style={styles.recoveryPhraseContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordPill}>
              <Text style={styles.wordText}>{`${index + 1}. ${word}`}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={handleCopyToClipboard} style={styles.copyButtonContainer}>
            <Ionicons
              name={copySuccess ? 'checkmark-circle' : 'copy-outline'}
              size={24}
              color={copySuccess ? Colors.success : Colors.primary}
            />
            <Text style={{ color: copySuccess ? Colors.success : Colors.primary }}>
              {copySuccess ? 'Copied!' : 'Copy Phrase'}
            </Text>
          </TouchableOpacity>
        </View>
        <Button title='I Have Saved My Phrase' onPress={handleAcknowledge} fullWidth variant='primary' />
      </View>
    )
  }

  return (
    <View style={styles.sheetContentContainer}>
      <Text preset='h4' style={styles.sheetTitle}>
        View Recovery Phrase
      </Text>
      <Text preset='paragraph' style={styles.warningText}>
        Enter your current password to view your recovery phrase. Keep it secret, keep it safe!
      </Text>
      <View style={styles.inputContainer}>
        <Input
          placeholder='Enter your password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[genericStyles.input, styles.input]}
          leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.buttonContainer}>
        <Button title='Reveal Phrase' onPress={handleRevealPhrase} fullWidth loading={isLoading} disabled={isLoading} />
      </View>
      <Button title='Cancel' onPress={handleCloseAndReset} variant='secondary' fullWidth style={{ marginTop: 10 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  sheetContentContainer: {
    padding: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 15
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 5
  },
  inputContainer: {
    width: '100%',
    gap: 5
  },
  input: {},
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10
  },
  buttonContainer: {
    marginTop: 5
  },
  recoveryPhraseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundSubtle
  },
  wordPill: {
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.backgroundLight
  },
  wordText: {
    fontSize: 14,
    color: Colors.text
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  copyButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  warningText: {
    textAlign: 'center',
    marginBottom: 10,
    color: Colors.warning,
    fontSize: 13
  }
})

export default ViewRecoveryPhraseDrawerContent
