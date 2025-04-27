import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text, Button, Input } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useWalletStore } from '@/store/walletStore'
import { Ionicons } from '@expo/vector-icons'
import { genericStyles } from '@/constants/GenericStyles'
import { TEAM_MINT_ADDRESS, teamDecimals } from '@/constants/Tokens'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

// Type definitions
type SwapDrawerProps = {
  onClose: () => void
  onDismiss?: () => void
  solBalance: number | null
  teamBalance: number | null
  fetchSolBalance: () => Promise<void>
  fetchTeamBalance: () => Promise<void>
}

type TokenOption = 'SOL' | 'TEAM'
type SwapStatus = 'idle' | 'swapping' | 'success' | 'error'

// Mock swap rate - would come from API in production
const MOCK_SWAP_RATE = {
  SOL_TO_TEAM: 120, // 1 SOL = 120 TEAM
  TEAM_TO_SOL: 0.008 // 1 TEAM = 0.008 SOL
}

export const SwapDrawerContent: React.FC<SwapDrawerProps> = ({
  onClose,
  onDismiss,
  solBalance,
  teamBalance,
  fetchSolBalance,
  fetchTeamBalance
}) => {
  // State management
  const [fromToken, setFromToken] = useState<TokenOption>('SOL')
  const [toToken, setToToken] = useState<TokenOption>('TEAM')
  const [amount, setAmount] = useState('')
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  const { user } = useAuthStore()
  const { showToast } = useToastStore()

  // Get the available balance based on the selected token
  const availableBalance = fromToken === 'SOL' ? solBalance : teamBalance

  // Helper function to calculate button variant
  const calculateButtonVariant = (percentage: number): 'primary' | 'outline' => {
    if (!amount || availableBalance === null) return 'outline'
    const targetAmount = (availableBalance * percentage).toFixed(fromToken === 'SOL' ? 9 : teamDecimals)
    return amount === targetAmount ? 'primary' : 'outline'
  }

  // Swap the tokens when the user clicks the swap icon
  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')
    setEstimatedReceiveAmount('')
  }

  // Calculate the estimated receive amount when the input amount changes
  useEffect(() => {
    if (!amount) {
      setEstimatedReceiveAmount('')
      return
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setEstimatedReceiveAmount('')
      return
    }

    let swapRate = 0
    if (fromToken === 'SOL' && toToken === 'TEAM') {
      swapRate = MOCK_SWAP_RATE.SOL_TO_TEAM
    } else if (fromToken === 'TEAM' && toToken === 'SOL') {
      swapRate = MOCK_SWAP_RATE.TEAM_TO_SOL
    }

    const estimated = numericAmount * swapRate

    // Format based on token decimals
    const decimals = toToken === 'SOL' ? 4 : 2
    setEstimatedReceiveAmount(estimated.toFixed(decimals))
  }, [amount, fromToken, toToken])

  // Handle the next button
  const handleNext = async () => {
    // Reset error
    setError(null)

    // Validate inputs
    const numericAmount = parseFloat(amount)
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    if (numericAmount > (availableBalance ?? 0)) {
      setError('Insufficient balance.')
      return
    }

    // In a real implementation, this would validate the swap can be done
    // For now, just move to the confirm step
    setStep('confirm')
  }

  // Handle the swap confirmation
  const handleConfirmSwap = async () => {
    if (!password) {
      setError('Password is required.')
      return
    }

    setError(null)
    setSwapStatus('swapping')

    try {
      // In a real implementation, this would call the API to perform the swap
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate success
      setSwapStatus('success')
      showToast(`Successfully swapped ${amount} ${fromToken} to ${estimatedReceiveAmount} ${toToken}`, 'success')

      // Refresh balances
      await fetchSolBalance()
      await fetchTeamBalance()

      // Close the drawer
      onClose()
    } catch (error: any) {
      console.error('Swap error:', error)
      setError(error.message || 'An error occurred during the swap.')
      setSwapStatus('error')
    } finally {
      setPassword('')
    }
  }

  // Handle setting amount as a percentage of available balance
  const handleSetPercentage = (percentage: number) => {
    if (availableBalance === null || availableBalance === undefined) return

    const calculatedAmount = availableBalance * percentage

    // Format based on token decimals
    const decimals = fromToken === 'SOL' ? 9 : teamDecimals
    const formattedAmount = calculatedAmount.toFixed(decimals)

    // Avoid setting amount like 0.000000000 for very small balances
    setAmount(parseFloat(formattedAmount) > 0 ? formattedAmount : '0')
  }

  return (
    <View style={styles.container}>
      <Text preset='h3' style={styles.title}>
        Swap Tokens
      </Text>

      {step === 'form' && (
        <>
          {/* From Token Section */}
          <View style={styles.formSection}>
            <Text preset='label' style={styles.sectionTitle}>
              From
            </Text>
            <View style={styles.tokenSelectionContainer}>
              <View style={styles.segmentContainer}>
                <TouchableOpacity
                  style={[styles.segmentButton, fromToken === 'SOL' && styles.segmentButtonActive]}
                  onPress={() => setFromToken('SOL')}
                >
                  <Text style={[styles.segmentText, fromToken === 'SOL' && styles.segmentTextActive]}>SOL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, fromToken === 'TEAM' && styles.segmentButtonActive]}
                  onPress={() => setFromToken('TEAM')}
                >
                  <Text style={[styles.segmentText, fromToken === 'TEAM' && styles.segmentTextActive]}>TEAM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text preset='caption' style={styles.balanceLabel}>
                Available Balance:
              </Text>
              <Text preset='label' style={styles.balanceAmount}>
                {availableBalance?.toFixed(fromToken === 'SOL' ? 4 : 2) ?? '0.00'} {fromToken}
              </Text>
            </View>

            <View style={styles.amountContainer}>
              <Input
                label={`Amount (${fromToken})`}
                placeholder='0.00'
                value={amount}
                onChangeText={setAmount}
                keyboardType='numeric'
                style={[genericStyles.input, styles.input, styles.amountInput]}
              />
            </View>

            {/* Percentage Buttons */}
            <View style={styles.percentageButtonRow}>
              <Button
                title='25%'
                onPress={() => handleSetPercentage(0.25)}
                variant={calculateButtonVariant(0.25)}
                style={styles.percentageButton}
              />
              <Button
                title='50%'
                onPress={() => handleSetPercentage(0.5)}
                variant={calculateButtonVariant(0.5)}
                style={styles.percentageButton}
              />
              <Button
                title='75%'
                onPress={() => handleSetPercentage(0.75)}
                variant={calculateButtonVariant(0.75)}
                style={styles.percentageButton}
              />
              <Button
                title='Max'
                onPress={() => handleSetPercentage(1.0)}
                variant={calculateButtonVariant(1.0)}
                style={styles.percentageButton}
              />
            </View>
          </View>

          {/* Swap Icon */}
          <TouchableOpacity onPress={handleSwapTokens} style={styles.swapIconContainer}>
            <View style={styles.swapIconCircle}>
              <Ionicons name='swap-vertical' size={24} color={Colors.tint} />
            </View>
          </TouchableOpacity>

          {/* To Token Section */}
          <View style={styles.formSection}>
            <Text preset='label' style={styles.sectionTitle}>
              To
            </Text>
            <View style={styles.tokenSelectionContainer}>
              <View style={styles.segmentContainer}>
                <TouchableOpacity
                  style={[styles.segmentButton, toToken === 'SOL' && styles.segmentButtonActive]}
                  onPress={() => setToToken('SOL')}
                  disabled={toToken === 'SOL'}
                >
                  <Text style={[styles.segmentText, toToken === 'SOL' && styles.segmentTextActive]}>SOL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, toToken === 'TEAM' && styles.segmentButtonActive]}
                  onPress={() => setToToken('TEAM')}
                  disabled={toToken === 'TEAM'}
                >
                  <Text style={[styles.segmentText, toToken === 'TEAM' && styles.segmentTextActive]}>TEAM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.receiveContainer}>
              <Text preset='label' style={styles.receiveLabel}>
                You'll receive approximately:
              </Text>
              <Text preset='h4' style={styles.receiveAmount}>
                {estimatedReceiveAmount ? `${estimatedReceiveAmount} ${toToken}` : '-'}
              </Text>
            </View>

            <View style={styles.exchangeRateContainer}>
              <Text preset='caption' style={styles.exchangeRateText}>
                Exchange Rate: 1 {fromToken} ≈{' '}
                {String(fromToken === 'SOL' ? MOCK_SWAP_RATE.SOL_TO_TEAM : MOCK_SWAP_RATE.TEAM_TO_SOL)} {toToken}
              </Text>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actionButtonsContainer}>
            <Button title='Cancel' onPress={onClose} variant='secondary' style={styles.button} />
            <Button
              title='Next'
              onPress={handleNext}
              variant='primary'
              style={styles.button}
              disabled={!amount || parseFloat(amount) <= 0}
            />
          </View>
        </>
      )}

      {step === 'confirm' && (
        <>
          <View style={styles.confirmationSection}>
            <Text preset='paragraph' style={styles.confirmationText}>
              Enter your password to confirm swapping
            </Text>
            <Text preset='h4' style={styles.confirmationAmount}>
              {amount} {fromToken}
            </Text>
            <Text preset='paragraph' style={styles.confirmationText}>
              for approximately
            </Text>
            <Text preset='h4' style={styles.confirmationAmount}>
              {estimatedReceiveAmount} {toToken}
            </Text>
          </View>

          <View style={styles.passwordSection}>
            <Input
              label='Password'
              placeholder='Enter password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize='none'
              style={[genericStyles.input, styles.input, styles.passwordInput]}
              autoFocus={true}
            />
          </View>

          {error && <Text style={[styles.errorText, { marginBottom: 10 }]}>{error}</Text>}

          <View style={styles.modalActions}>
            <Button
              title='Back'
              onPress={() => {
                setStep('form')
                setPassword('')
                setError(null)
              }}
              variant='secondary'
              style={{ flex: 1, marginRight: 5 }}
              disabled={swapStatus === 'swapping'}
            />
            <Button
              title={swapStatus === 'swapping' ? 'Processing...' : 'Confirm Swap'}
              onPress={handleConfirmSwap}
              style={{ flex: 1, marginLeft: 5 }}
              disabled={swapStatus === 'swapping' || !password}
              leftIcon={
                swapStatus === 'swapping' ? <ActivityIndicator size='small' color={Colors.background} /> : undefined
              }
            />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    gap: 12
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold'
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold'
  },
  tokenSelectionContainer: {
    marginBottom: 6
  },
  balanceContainer: {
    marginTop: 6,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8
  },
  balanceLabel: {
    color: Colors.icon
  },
  balanceAmount: {
    fontWeight: 'bold'
  },
  formSection: {},
  amountContainer: {
    gap: 10
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: 3
  },
  swapIconCircle: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  receiveContainer: {
    marginTop: 6,
    padding: 12,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    alignItems: 'center'
  },
  receiveLabel: {
    marginBottom: 8,
    color: Colors.icon
  },
  receiveAmount: {
    fontWeight: 'bold',
    color: Colors.tint
  },
  exchangeRateContainer: {
    marginTop: 6,
    marginBottom: 6,
    alignItems: 'center'
  },
  exchangeRateText: {
    color: Colors.icon
  },
  actionButtonsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  button: {
    flex: 1
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6
  },
  input: {
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 10
  },
  amountInput: {
    marginBottom: 2
  },
  passwordInput: {
    marginBottom: 10,
    backgroundColor: Colors.backgroundDarker
  },
  percentageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  percentageButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    height: 'auto',
    minHeight: 32
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundDarker
  },
  segmentButtonActive: {
    backgroundColor: Colors.tint
  },
  segmentText: {
    color: Colors.icon,
    fontSize: 14,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: Colors.tabIconSelected
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  confirmationSection: {
    marginVertical: 8,
    backgroundColor: Colors.backgroundDark,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  confirmationText: {
    textAlign: 'center',
    marginBottom: 6
  },
  confirmationAmount: {
    color: Colors.tint,
    marginVertical: 6,
    fontWeight: 'bold'
  },
  passwordSection: {
    marginTop: 10,
    marginBottom: 8
  }
})

export default SwapDrawerContent
