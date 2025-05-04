import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { debounce } from 'lodash'
import { getSwapQuote, executeSwap, submitTokenAccountTransaction, signTransaction } from '../services/api'
import axios from 'axios'

// Basic type for Jupiter V6 Quote Response (expand as needed)
// Consider moving to a shared types package
interface QuoteResponseV6 {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee: any // Adjust type as needed
  priceImpactPct: string
  routePlan: any[] // Adjust type as needed
  contextSlot: number
  timeTaken: number
}

// Type for token account setup response
interface TokenAccountSetupData {
  createAccountTransaction: string
  missingAccounts: { mint: string; address: string }[]
}

// Type definitions
type SwapDrawerProps = {
  onClose: () => void
  onDismiss?: () => void
  solBalance: number | null
  teamBalance: number | null
  fetchSolBalance: () => Promise<void>
  fetchTeamBalance: () => Promise<void>
  walletAddress?: string // Add wallet address prop
}

type TokenOption = 'SOL' | 'TEAM'
type SwapStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'confirming'
  | 'error'
  | 'success'
  | 'setting_up_token_accounts'
  | 'swapping'
type StepType = 'form' | 'confirmTokenAccounts' | 'confirm'

export const SwapDrawerContent: React.FC<SwapDrawerProps> = ({
  onClose,
  onDismiss,
  solBalance,
  teamBalance,
  fetchSolBalance,
  fetchTeamBalance,
  walletAddress
}) => {
  // State management
  const [fromToken, setFromToken] = useState<TokenOption>('SOL')
  const [toToken, setToToken] = useState<TokenOption>('TEAM')
  const [amount, setAmount] = useState('')
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<StepType>('form')
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponseV6 | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<string | null>(null) // Add state for exchange rate
  // Add state for token account setup
  const [tokenAccountSetup, setTokenAccountSetup] = useState<TokenAccountSetupData | null>(null)
  // Store our wallet address
  const [userWalletAddress, setUserWalletAddress] = useState<string | undefined>(walletAddress)

  const { user, token } = useAuthStore()
  const { showToast } = useToastStore()
  const { isAuthenticated } = useAuthStore()

  // Fetch wallet address when needed
  useEffect(() => {
    // First priority: Use address from props
    if (walletAddress) {
      setUserWalletAddress(walletAddress)
    }
    // Second priority: Get from user object in auth store
    else if (user?.wallets && user.wallets.length > 0) {
      setUserWalletAddress(user.wallets[0].address)
    }
  }, [walletAddress, user])

  // Get the available balance based on the selected token
  const availableBalance = fromToken === 'SOL' ? solBalance : teamBalance

  // Helper function to calculate button variant
  const calculateButtonVariant = (percentage: number): 'primary' | 'outline' => {
    if (!amount || availableBalance === null) return 'outline'
    const numericAvailable = availableBalance ?? 0
    // Use a small tolerance for floating point comparisons
    const targetAmount = numericAvailable * percentage
    const currentAmount = parseFloat(amount)
    const tolerance = 1e-9 // Adjust tolerance based on expected precision

    // Check if the current amount is very close to the target percentage amount
    return Math.abs(currentAmount - targetAmount) < tolerance ? 'primary' : 'outline'
  }

  // --- Debounced Quote Fetching ---
  const fetchQuoteDebounced = React.useCallback(
    debounce(async (fetchAmount: string, from: TokenOption, to: TokenOption) => {
      if (!fetchAmount || isNaN(parseFloat(fetchAmount)) || parseFloat(fetchAmount) <= 0) {
        setEstimatedReceiveAmount('')
        setQuoteResponse(null)
        setIsQuoteLoading(false)
        setError(null) // Clear previous errors if amount is invalid
        return
      }

      setIsQuoteLoading(true)
      setError(null)
      setQuoteResponse(null) // Clear previous quote
      setEstimatedReceiveAmount('') // Clear previous estimate

      try {
        if (!token) {
          // Check if token exists
          throw new Error('Authentication token not found.')
        }

        const inputMint = from === 'SOL' ? 'So11111111111111111111111111111111111111112' : TEAM_MINT_ADDRESS
        const outputMint = to === 'SOL' ? 'So11111111111111111111111111111111111111112' : TEAM_MINT_ADDRESS
        const amountInSmallestUnit = Math.floor(
          parseFloat(fetchAmount) * (from === 'SOL' ? LAMPORTS_PER_SOL : 10 ** teamDecimals)
        )

        console.log('Fetching quote with:', {
          inputMint,
          outputMint,
          amount: amountInSmallestUnit.toString(),
          slippageBps: 50 // Example slippage (0.5%)
        })

        const quotePayload = {
          inputMint,
          outputMint,
          amount: Number(amountInSmallestUnit), // Convert amount to number here
          slippageBps: 50 // TODO: Allow user to configure slippage
        }
        const response = await getSwapQuote(quotePayload, token)

        if (response && response.quoteResponse) {
          const quote: QuoteResponseV6 = response.quoteResponse
          setQuoteResponse(quote)

          // Calculate and set exchange rate
          try {
            const inDecimals = from === 'SOL' ? 9 : teamDecimals
            const outDecimals = to === 'SOL' ? 9 : teamDecimals
            const inAmountNum = Number(quote.inAmount) / 10 ** inDecimals
            const outAmountNum = Number(quote.outAmount) / 10 ** outDecimals

            if (inAmountNum > 0 && outAmountNum > 0) {
              const rate = outAmountNum / inAmountNum
              setExchangeRate(rate.toFixed(6)) // Format to 6 decimals
            } else {
              setExchangeRate(null) // Avoid division by zero or invalid amounts
            }
          } catch (rateCalcError) {
            console.error('Error calculating exchange rate:', rateCalcError)
            setExchangeRate(null)
          }

          const outputAmountInDecimal =
            parseInt(quote.outAmount) / (to === 'SOL' ? LAMPORTS_PER_SOL : 10 ** teamDecimals)
          setEstimatedReceiveAmount(outputAmountInDecimal.toFixed(to === 'SOL' ? 9 : teamDecimals))
          setError(null) // Clear error on success
        } else {
          setError('Could not fetch swap quote.')
          setExchangeRate(null) // Clear rate on error
        }
      } catch (err: any) {
        console.error('Error fetching quote:', err)
        const message = err.response?.data?.error || err.message || 'Failed to fetch swap quote.'
        setError(message)
        setQuoteResponse(null)
        setEstimatedReceiveAmount('')
        setExchangeRate(null) // Clear rate on error
      } finally {
        setIsQuoteLoading(false)
      }
    }, 500), // 500ms debounce
    [fromToken, toToken, token] // Recreate debounce if tokens or token change
  )

  // Trigger debounced quote fetch when amount changes
  useEffect(() => {
    fetchQuoteDebounced(amount, fromToken, toToken)
    // Cleanup function to cancel pending debounced calls if component unmounts or dependencies change
    return () => {
      fetchQuoteDebounced.cancel()
    }
  }, [amount, fromToken, toToken, fetchQuoteDebounced])

  // --- Token Account Creation ---

  // Handle token account creation confirm
  const handleConfirmTokenAccounts = async () => {
    if (!password) {
      setError('Password is required.')
      return
    }
    if (!tokenAccountSetup) {
      setError('Token account setup data is missing.')
      return
    }
    if (!isAuthenticated || !token) {
      setError('User authentication not found. Please log in again.')
      return
    }

    setError(null)
    setSwapStatus('swapping')

    try {
      console.log('Creating token accounts with transaction:', tokenAccountSetup.createAccountTransaction)

      // IMPORTANT: First sign the transaction using the wallet service
      // This is the critical step we were missing
      const signResponse = await signTransaction(token, password, tokenAccountSetup.createAccountTransaction)

      if (!signResponse || !signResponse.signedTransaction) {
        throw new Error('Failed to sign the token account transaction')
      }

      // Now submit the SIGNED transaction
      const response = await submitTokenAccountTransaction(signResponse.signedTransaction, password, token)

      console.log('Token account creation response:', response)

      if (response && response.status === 'success') {
        showToast(`Token account(s) created! Tx: ${response.signature.substring(0, 10)}...`, 'success')

        // Wait a bit longer for accounts to potentially become visible onchain before retrying swap
        // Consider using a more robust check if possible (e.g., polling getAccountInfo)
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Now proceed to the swap
        setTokenAccountSetup(null)
        // Directly call handleConfirmSwap to retry the swap automatically
        console.log('Token accounts created, automatically retrying swap...')
        await handleConfirmSwap(password) // Pass the current password state

        // Note: handleConfirmSwap will handle setting the final status (success/error) and clearing the password
      } else {
        throw new Error(response?.message || 'Token account creation failed.')
      }
    } catch (error: any) {
      console.error('Token account creation error:', error)

      // Enhanced error handling - specific handling for JSON parse errors
      let errorMessage = 'An error occurred during token account creation.'

      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorMessage = 'Invalid response from server. Please try again.'
        console.error('JSON parsing error:', error.message)
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setSwapStatus('error')
    }
  }

  // --- Swap Execution ---

  // Handle the swap confirmation
  const handleConfirmSwap = async (swapPassword?: string) => {
    // Accept optional password
    const effectivePassword = swapPassword || password // Use passed password or state

    if (!effectivePassword) {
      setError('Password is required.')
      return
    }
    if (!quoteResponse) {
      setError('Swap quote is not available. Please try again.')
      return
    }
    if (!isAuthenticated || !token) {
      setError('User authentication not found. Please log in again.')
      return
    }
    if (!userWalletAddress) {
      setError('Wallet address not found. Please refresh the app.')
      return
    }

    setError(null)
    setSwapStatus('swapping')

    try {
      console.log('Attempting swap with quote:', quoteResponse)
      // Call the backend API to execute the swap
      const swapPayload = {
        password: effectivePassword, // Send plain password for backend decryption
        quoteResponse: quoteResponse, // Send the fetched quote response
        publicKey: userWalletAddress // Send the wallet's public key
      }
      const response = await executeSwap(swapPayload, token, userWalletAddress)

      console.log('Swap API Response:', response)

      // Check if token accounts need to be created
      if (response.status === 'needs_token_accounts' && response.createAccountTransaction) {
        setTokenAccountSetup({
          createAccountTransaction: response.createAccountTransaction,
          missingAccounts: response.missingAccounts || []
        })
        setStep('confirmTokenAccounts')
        setSwapStatus('idle')
        return
      }

      if (response && response.status === 'success' && response.signature) {
        setSwapStatus('success')
        showToast(`Swap submitted! Tx: ${response.signature.substring(0, 10)}...`, 'success')

        // Optionally wait a bit for balances to update on-chain before refetching
        // Consider using a more robust check if possible (e.g., polling getAccountInfo)
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Refresh balances
        await fetchSolBalance()
        await fetchTeamBalance()

        // Close the drawer on success
        onClose()
      } else {
        throw new Error(response?.message || 'Swap execution failed. No signature returned.')
      }
    } catch (error: any) {
      console.error('Swap execution error:', error)
      const message = error.response?.data?.error || error.message || 'An error occurred during the swap execution.'
      setError(message)
      setSwapStatus('error')
    } finally {
      setPassword('') // Clear password input state
      // Keep swapStatus as 'error' or 'success' unless we want to reset it?
      // Maybe reset status if user goes back from confirm step?
    }
  }

  // Swap the tokens when the user clicks the swap icon
  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')
    setEstimatedReceiveAmount('')
  }

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

  // Function to get a display-friendly token name from mint address
  const getTokenName = (mintAddress: string): string => {
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      return 'SOL'
    } else if (mintAddress === TEAM_MINT_ADDRESS) {
      return 'TEAM'
    }
    return `${mintAddress.substring(0, 4)}...${mintAddress.substring(mintAddress.length - 4)}`
  }

  // Setup a token account if needed
  const handleSetupTokenAccount = async () => {
    if (!password) {
      setError('Password is required')
      return
    }

    if (!tokenAccountSetup) {
      setError('Token account setup data is missing')
      return
    }

    if (!isAuthenticated || !token) {
      setError('User authentication required')
      return
    }

    try {
      setSwapStatus('swapping')

      // Step 1: Sign the transaction
      const signedData = await signTransaction(token, password, tokenAccountSetup.createAccountTransaction)

      // Step 2: Submit the signed transaction
      const result = await submitTokenAccountTransaction(signedData.signedTransaction, password, token)

      console.log('Token account created:', result)

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Move to swap confirmation
      setStep('confirm')
      setTokenAccountSetup(null)
      setSwapStatus('idle')
      setPassword('')
    } catch (error: any) {
      console.error('Error creating token account:', error)

      let errorMessage = 'Failed to create token account'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setSwapStatus('error')
    }
  }

  // Execute the swap
  const handleExecuteSwap = async () => {
    if (!password) {
      setError('Password is required')
      return
    }

    if (!quoteResponse) {
      setError('Swap quote not available')
      return
    }

    if (!isAuthenticated || !token) {
      setError('User authentication required')
      return
    }

    if (!userWalletAddress) {
      setError('Wallet address not available')
      return
    }

    try {
      setSwapStatus('swapping')

      // Create the payload for the swap execution
      const swapPayload = {
        password,
        quoteResponse,
        publicKey: userWalletAddress
      }

      // Execute the swap using the imported function
      const result = await executeSwap(swapPayload, token, userWalletAddress)

      // Check if we need to create token accounts
      if (result.status === 'needs_token_accounts' && result.createAccountTransaction) {
        setTokenAccountSetup({
          createAccountTransaction: result.createAccountTransaction,
          missingAccounts: result.missingAccounts || []
        })
        setStep('confirmTokenAccounts')
        setSwapStatus('idle')
        return
      }

      if (result.status === 'success' && result.signature) {
        setSwapStatus('success')
        showToast(`Swap submitted! Tx: ${result.signature.substring(0, 10)}...`, 'success')

        // Wait for confirmation and refresh balances
        await new Promise(resolve => setTimeout(resolve, 5000))
        await fetchSolBalance()
        await fetchTeamBalance()

        // Close drawer
        onClose()
      } else {
        throw new Error(result?.message || 'Swap execution failed')
      }
    } catch (error: any) {
      console.error('Error executing swap:', error)

      let errorMessage = 'Failed to execute swap'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setSwapStatus('error')
    } finally {
      setPassword('')
    }
  }

  const setupTokenAccount = async (
    createAccountTransaction: string,
    missingAccounts: { mint: string; address: string }[]
  ) => {
    console.log('Setting up token accounts before swap', { missingAccounts })
    setSwapStatus('setting_up_token_accounts')

    try {
      // Get user's password
      if (!password) {
        showToast('Password is required for this transaction', 'error')
        setSwapStatus('error')
        return false
      }

      if (!token) {
        showToast('Authentication token not found', 'error')
        setSwapStatus('error')
        return false
      }

      // Sign the transaction with the user's password
      const signResponse = await signTransaction(token, password, createAccountTransaction)

      // Submit the signed transaction to create token accounts
      const result = await submitTokenAccountTransaction(signResponse.signedTransaction, password, token)

      console.log('Token accounts created:', result)
      return true
    } catch (error) {
      console.error('Error setting up token accounts:', error)
      showToast('Failed to set up token accounts', 'error')
      setSwapStatus('error')
      return false
    }
  }

  const mySignTransaction = async ({
    password,
    unsignedTransaction
  }: {
    password: string
    unsignedTransaction: string
  }) => {
    try {
      // Sign the transaction using the user's password
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await signTransaction(token, password, unsignedTransaction)
      return response
    } catch (error: any) {
      console.error('Error signing transaction:', error)
      // Provide more user-friendly error messages
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Incorrect password or authentication failed')
      }
      throw new Error(error.response?.data?.error || 'Failed to sign transaction')
    }
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
            <Text preset='error' style={{ marginBottom: 16 }}>
              Ensure you have at least 0.01 SOL in your wallet to cover transaction fees.
            </Text>
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
                Exchange Rate: 1 {fromToken} ≈ {exchangeRate ? exchangeRate : '-'} {toToken}
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

      {step === 'confirmTokenAccounts' && tokenAccountSetup && (
        <>
          <View style={styles.tokenAccountsSection}>
            <Ionicons name='alert-circle-outline' size={32} color={Colors.tint} style={styles.alertIcon} />
            <Text preset='h4' style={styles.tokenAccountsTitle}>
              Create Token Accounts
            </Text>
            <Text preset='paragraph' style={styles.tokenAccountsText}>
              Before swapping, we need to create token accounts for the tokens involved in this transaction.
            </Text>

            <View style={styles.tokenAccountsList}>
              {tokenAccountSetup.missingAccounts.map((account, index) => (
                <Text key={index} preset='label' style={styles.tokenAccountItem}>
                  • {getTokenName(account.mint)} token account
                </Text>
              ))}
            </View>

            <Text preset='caption' style={styles.tokenAccountsInfo}>
              This one-time setup is required for each token. After creation, you won't need to repeat this step.
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
                setTokenAccountSetup(null)
                setError(null)
              }}
              variant='secondary'
              style={{ flex: 1, marginRight: 5 }}
              disabled={swapStatus === 'swapping'}
            />
            <Button
              title={swapStatus === 'swapping' ? 'Creating...' : 'Confirm'}
              onPress={handleConfirmTokenAccounts}
              style={{ flex: 1, marginLeft: 5 }}
              disabled={swapStatus === 'swapping' || !password}
              leftIcon={
                swapStatus === 'swapping' ? <ActivityIndicator size='small' color={Colors.background} /> : undefined
              }
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
              onPress={() => handleConfirmSwap()} // Call without args for manual confirmation
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
    padding: 16,
    gap: 16
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
  },
  estimatedValueContainer: {
    minHeight: 24,
    justifyContent: 'center'
  },
  estimatedValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text
  },
  slippageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4
  },
  // Styles for token account creation UI
  tokenAccountsSection: {
    marginVertical: 8,
    backgroundColor: Colors.backgroundDark,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  alertIcon: {
    marginBottom: 10
  },
  tokenAccountsTitle: {
    marginBottom: 10,
    color: Colors.tint,
    fontWeight: 'bold'
  },
  tokenAccountsText: {
    textAlign: 'center',
    marginBottom: 16
  },
  tokenAccountsList: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    width: '100%',
    paddingLeft: 10
  },
  tokenAccountItem: {
    marginBottom: 8,
    color: Colors.text
  },
  tokenAccountsInfo: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: Colors.icon
  }
})

export default SwapDrawerContent
