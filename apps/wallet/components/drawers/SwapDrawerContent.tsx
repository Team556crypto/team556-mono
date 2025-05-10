import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { Text, Button, Input } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { Ionicons } from '@expo/vector-icons'
import { genericStyles } from '@/constants/GenericStyles'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { debounce } from 'lodash'
import { getSwapQuote, executeSwap, submitTokenAccountTransaction, signTransaction } from '@/services/api'
import DexScreenerChart from './DexScreenerChart'

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
  initialInputToken?: TokenOption // NEW: Add prop for initial input token
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
  walletAddress,
  initialInputToken // NEW: Destructure prop
}) => {
  // State management
  const [fromToken, setFromToken] = useState<TokenOption>(initialInputToken ?? 'SOL') // MODIFIED: Use prop for initial 'from'
  const [toToken, setToToken] = useState<TokenOption>(initialInputToken === 'TEAM' ? 'SOL' : 'TEAM') // MODIFIED: Set initial 'to' based on 'from'
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

        // --- Check for required environment variables ---
        const teamMintAddress = process.env.EXPO_PUBLIC_GLOBAL__MINT_ADDRESS
        const teamMintDecimalsStr = process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS

        if (!teamMintAddress || !teamMintDecimalsStr) {
          setError('Token configuration missing in environment variables.')
          setIsQuoteLoading(false)
          return // Stop execution
        }

        const teamMintDecimals = Number(teamMintDecimalsStr)
        if (isNaN(teamMintDecimals)) {
          setError('Invalid token decimal configuration.')
          setIsQuoteLoading(false)
          return
        }
        // --- End Check ---

        const inputMint = from === 'SOL' ? 'So11111111111111111111111111111111111111112' : teamMintAddress
        const outputMint = to === 'SOL' ? 'So11111111111111111111111111111111111111112' : teamMintAddress

        const amountInSmallestUnit = Math.floor(
          parseFloat(fetchAmount) * (from === 'SOL' ? LAMPORTS_PER_SOL : 10 ** teamMintDecimals)
        )

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
            const inDecimals = from === 'SOL' ? 9 : teamMintDecimals
            const outDecimals = to === 'SOL' ? 9 : teamMintDecimals
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
            parseInt(quote.outAmount) / (to === 'SOL' ? LAMPORTS_PER_SOL : 10 ** teamMintDecimals)
          setEstimatedReceiveAmount(outputAmountInDecimal.toFixed(to === 'SOL' ? 9 : teamMintDecimals))
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
      // IMPORTANT: First sign the transaction using the wallet service
      // This is the critical step we were missing
      const signResponse = await signTransaction(token, password, tokenAccountSetup.createAccountTransaction)

      if (!signResponse || !signResponse.signedTransaction) {
        throw new Error('Failed to sign the token account transaction')
      }

      // Now submit the SIGNED transaction
      const response = await submitTokenAccountTransaction(signResponse.signedTransaction, password, token)

      if (response && response.status === 'success') {
        showToast(`Token account(s) created! Tx: ${response.signature.substring(0, 10)}...`, 'success')

        // Wait a bit longer for accounts to potentially become visible onchain before retrying swap
        // Consider using a more robust check if possible (e.g., polling getAccountInfo)
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Now proceed to the swap
        setTokenAccountSetup(null)
        // Directly call handleConfirmSwap to retry the swap automatically
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
      // Call the backend API to execute the swap
      const swapPayload = {
        password: effectivePassword, // Send plain password for backend decryption
        quoteResponse: quoteResponse, // Send the fetched quote response
        publicKey: userWalletAddress // Send the wallet's public key
      }
      const response = await executeSwap(swapPayload, token)

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

  // Handle setting amount as a percentage of available balance
  const handleSetPercentage = (percentage: number) => {
    if (availableBalance === null || availableBalance === undefined) return

    const calculatedAmount = availableBalance * percentage

    // Format based on token decimals
    const teamMintDecimalsStr = process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS
    const decimals = fromToken === 'SOL' ? 9 : teamMintDecimalsStr ? Number(teamMintDecimalsStr) : 9 // Default to 9 if undefined
    const formattedAmount = calculatedAmount.toFixed(decimals)

    // Avoid setting amount like 0.000000000 for very small balances
    setAmount(parseFloat(formattedAmount) > 0 ? formattedAmount : '0')
  }

  // Function to get a display-friendly token name from mint address
  const getTokenName = (mintAddress: string): string => {
    const teamMintAddress = process.env.EXPO_PUBLIC_GLOBAL__MINT_ADDRESS
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      return 'SOL'
    } else if (teamMintAddress && mintAddress === teamMintAddress) {
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

      {/* Display From/To Tokens (Non-interactive) */}
      <View style={styles.tokenDisplayContainer}>
        <View style={styles.tokenItem}>
          <Text preset='label'>From:</Text>
          <Text preset='default' style={styles.tokenName}>
            {fromToken}
          </Text>
        </View>
        <Ionicons name='arrow-forward' size={24} color={Colors.icon} />
        <View style={styles.tokenItem}>
          <Text preset='label'>To:</Text>
          <Text preset='default' style={styles.tokenName}>
            {toToken}
          </Text>
        </View>
      </View>

      {/* Amount Input Section */}
      {step === 'form' && (
        <>
          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Input
              placeholder={`Amount of ${fromToken} to swap`}
              value={amount}
              onChangeText={setAmount}
              keyboardType='numeric'
              style={[styles.amountInput, genericStyles.input]}
            />
          </View>

          {/* Estimated Receive Amount / Loading */}
          <View style={styles.estimatedAmountContainer}>
            <Text preset='label' style={styles.receiveLabel}>
              You'll receive approximately:
            </Text>
            {isQuoteLoading ? (
              <ActivityIndicator size='small' color={Colors.tint} style={styles.loadingIndicator} />
            ) : (
              <Text preset='h4' style={styles.receiveAmount}>
                {estimatedReceiveAmount ? `${Number(estimatedReceiveAmount).toFixed(4)} ${toToken}` : '-'}
              </Text>
            )}
          </View>

          {/* Exchange Rate */}
          <View style={styles.exchangeRateContainer}>
            <Text preset='caption' style={styles.exchangeRateText}>
              Exchange Rate: 1 {fromToken} ≈ {exchangeRate ? Number(exchangeRate).toFixed(4) : '-'} {toToken}
            </Text>
          </View>

          {/* DexScreener Chart - Conditional Rendering */}
          {Platform.OS === 'web' && fromToken === 'SOL' && toToken === 'TEAM' && (
            <DexScreenerChart />
          )}

          {/* Error Message - Show only if not loading */}
          {error && !isQuoteLoading && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actionButtonsContainer}>
            <Button title='Cancel' onPress={onClose} variant='secondary' style={[styles.button, { flex: 1 }]} />
            <Button
              title='Next'
              onPress={() => {
                setError(null)
                setStep('confirm')
              }}
              variant='primary'
              style={[styles.button, { flex: 1 }]}
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
  tokenDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundDark, // Subtle background
    borderRadius: 8
  },
  tokenItem: {
    alignItems: 'center',
    gap: 4
  },
  tokenName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  balanceText: {
    color: Colors.textSecondary,
    flexShrink: 1 // Allow text to shrink if needed
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8
  },
  percentageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  percentageButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    height: 'auto',
    minHeight: 32
  },
  estimatedAmountContainer: {
    marginTop: 10, // Add some space above
    alignItems: 'center' // Center items vertically
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
    color: Colors.error
  },
  input: {
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 10
  },
  inputContainer: {
    // NEW: Style for input wrapper
    marginBottom: 8
  },
  amountInput: {
    // Style for amount input
    // Add specific styles here if default Input style isn't enough
  },
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
  passwordInput: {
    marginBottom: 10,
    backgroundColor: Colors.backgroundDarker
  },
  loadingIndicator: {
    // Add specific styles if needed, e.g., margin
  }
})

export default SwapDrawerContent
