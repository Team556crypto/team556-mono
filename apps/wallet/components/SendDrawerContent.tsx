import React, { useState, useEffect, useMemo } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { Text, Button, Input } from '@team556/ui'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createTransferInstruction as createSplTransferInstruction,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import { Buffer } from 'buffer'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { Ionicons } from '@expo/vector-icons'
import { genericStyles } from '@/constants/GenericStyles'
import { SecureStoreUtils } from '@/utils/secureStore'
import { signTransaction } from '@/services/api'

// TODO: Get this from env vars
const SOLANA_RPC_URL = process.env.EXPO_PUBLIC_GLOBAL__MAINNET_RPC_URL

const LAMPORTS_PER_SOL_DECIMALS = 9;

type SendStatus = 'idle' | 'sending' | 'success' | 'error'

type SendDrawerProps = {
  onClose: () => void
  onDismiss?: () => void
  solBalance: number | null
  teamBalance: number | null
  fetchSolBalance: () => Promise<void>
  fetchTeamBalance: () => Promise<void>
}

type TokenOption = 'SOL' | 'TEAM'

export const SendDrawerContent: React.FC<SendDrawerProps> = ({
  onClose,
  onDismiss,
  solBalance,
  teamBalance,
  fetchSolBalance,
  fetchTeamBalance
}: SendDrawerProps) => {
  const [selectedToken, setSelectedToken] = useState<TokenOption>('SOL')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  const { user } = useAuthStore()
  const { showToast } = useToastStore()

  // Memoize sender address to avoid re-computation and simplify checks
  const senderWalletAddress = useMemo(() => user?.wallets?.[0]?.address, [user])

  // Memoize TEAM token decimals from environment variable
  const teamMintDecimals = useMemo(() => {
    const decimalsRaw = process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS;
    if (decimalsRaw === undefined) {
      console.error("EXPO_PUBLIC_GLOBAL__MINT_DECIMALS environment variable is not set!");
      // Optionally show an alert here or disable TEAM token functionality
      // Alert.alert("Config Error", "TEAM Token decimal configuration is missing.");
      return null; // Indicate missing configuration
    }
    const decimals = parseInt(decimalsRaw, 10);
    if (isNaN(decimals)) {
      console.error("Invalid EXPO_PUBLIC_GLOBAL__MINT_DECIMALS environment variable!");
      // Alert.alert("Config Error", "Invalid TEAM Token decimal configuration.");
      return null; // Indicate invalid configuration
    }
    return decimals;
  }, []);

  const availableBalance = selectedToken === 'SOL' ? solBalance : teamBalance

  const handleSend = async () => {
    // 1. Initial Validation
    setError(null)
    // Basic validation (more robust validation needed)
    if (!recipientAddress || !amount) {
      setError('Please fill in all fields.')
      return
    }
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Invalid amount.')
      return
    }
    if (numericAmount > (availableBalance ?? 0)) {
      setError('Insufficient balance.')
      return
    }

    // Move to password step
    setStep('confirm')
  }

  // Function to handle password submission and the actual sending logic
  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Password is required.') // Show error within the modal ideally
      Alert.alert('Error', 'Password is required.')
      return
    }
    setError(null)
    setSendStatus('sending')
    setTxSignature(null)

    let connection: Connection | null = null

    // 1. Establish Connection
    try {
      if (!SOLANA_RPC_URL) {
        throw new Error('Solana RPC URL is not configured.')
      }
      connection = new Connection(SOLANA_RPC_URL, 'confirmed')
      console.log('Connected to:', SOLANA_RPC_URL)
    } catch (setupError: any) {
      console.error('Connection setup error:', setupError)
      setError(`Connection failed: ${setupError.message || 'Unknown error'}`)
      showToast(`Connection failed: ${setupError.message || 'Unknown error'}`, 'error')
      setSendStatus('error')
      return // Stop if setup fails
    }

    try {
      // 2. Construct Transaction (reusing logic from original handleSend)
      // --- Add Guard Clause ---
      if (!senderWalletAddress) {
        console.error('Send Error: Sender wallet address is missing from user state.')
        setError('Your wallet information is not available. Please try logging out and back in.')
        showToast('Wallet info missing. Please re-login.', 'error')
        setSendStatus('error')
        return
      }
      // --- End Guard Clause ---
      // Use the validated sender address
      const senderPublicKey = new PublicKey(senderWalletAddress)
      const transaction = new Transaction()
      const recipientPublicKey = new PublicKey(recipientAddress)
      const numericAmount = parseFloat(amount) // Already validated in handleSend

      if (selectedToken === 'SOL') {
        const lamportsToSend = numericAmount * LAMPORTS_PER_SOL
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderPublicKey,
            toPubkey: recipientPublicKey,
            lamports: lamportsToSend
          })
        )
        console.log(`Prepared SOL transfer of ${numericAmount} SOL`)
      } else {
        const teamMintAddress = process.env.EXPO_PUBLIC_GLOBAL__MINT_ADDRESS;
        if (!teamMintAddress) {
          console.error("EXPO_PUBLIC_GLOBAL__MINT_ADDRESS environment variable is not set!");
          Alert.alert(
            "Configuration Error",
            "The application is missing essential configuration. Cannot proceed with the transaction."
          );
          setSendStatus('idle');
          return; // Stop execution if the mint address is missing
        }
        const teamMintPublicKey = new PublicKey(teamMintAddress); // Use the validated variable

        // Ensure teamMintDecimals were loaded correctly before proceeding
        if (teamMintDecimals === null) {
          console.error("Cannot perform TEAM transfer due to missing/invalid decimal configuration.");
          Alert.alert(
            "Configuration Error",
            "Token decimal configuration is invalid. Cannot proceed."
          );
          setSendStatus('idle');
          return;
        }

        const amountInSmallestUnit = BigInt(
          Math.round(numericAmount * 10 ** teamMintDecimals) // Use parsed decimal value
        );
        const senderTokenAccountAddress = await getAssociatedTokenAddress(teamMintPublicKey, senderPublicKey);
        const recipientTokenAccountAddress = await getAssociatedTokenAddress(teamMintPublicKey, recipientPublicKey);

        console.log('Sender ATA:', senderTokenAccountAddress.toBase58())
        console.log('Recipient ATA:', recipientTokenAccountAddress.toBase58())

        const recipientAtaInfo = await connection.getAccountInfo(recipientTokenAccountAddress)
        if (!recipientAtaInfo) {
          console.log('Recipient ATA does not exist. Creating...')
          transaction.add(
            createAssociatedTokenAccountInstruction(
              senderPublicKey, // Payer
              recipientTokenAccountAddress, // ATA Address
              recipientPublicKey, // Owner
              teamMintPublicKey // Mint
            )
          )
        }

        transaction.add(
          createSplTransferInstruction(
            senderTokenAccountAddress, // From account
            recipientTokenAccountAddress, // To account
            senderPublicKey, // Owner of the from account (needs to be signer)
            amountInSmallestUnit // Amount
          )
        )
        console.log(`Prepared TEAM transfer of ${numericAmount} TEAM`)
      }

      // Set recent blockhash
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      // Set fee payer - MUST be the account that API will sign with (retrieved from user context)
      transaction.feePayer = senderPublicKey

      // 3. Serialize Unsigned Transaction
      console.log('Serializing unsigned transaction...')
      const serializedUnsignedTx = transaction.serialize({ requireAllSignatures: false, verifySignatures: false })
      const unsignedTxBase64 = Buffer.from(serializedUnsignedTx).toString('base64')

      // 4. Call API to Sign Transaction
      console.log('Calling signTransaction API...')
      const token = useAuthStore.getState().token // Get token
      if (!token) throw new Error('Authentication token not found.')

      const signResponse = await signTransaction(token, password, unsignedTxBase64)
      console.log('API sign response received.')

      // 5. Send Signed Transaction
      console.log('Decoding and sending signed transaction...')
      const signedTxBytes = Buffer.from(signResponse.signedTransaction, 'base64')
      const signature = await connection.sendRawTransaction(signedTxBytes)
      console.log('Raw transaction sent. Signature:', signature)

      // 6. Confirm Transaction
      console.log('Confirming transaction...')
      await connection.confirmTransaction(signature, 'confirmed')
      console.log('Transaction confirmed!')

      // 7. Success State Update
      setTxSignature(signature)
      setSendStatus('success')
      showToast(`${selectedToken} sent successfully!`, 'success')

      // Trigger balance refresh
      await fetchSolBalance()
      await fetchTeamBalance()

      onClose() // Dismiss the drawer

      // Optionally close the drawer after success
      // onClose();
    } catch (sendError: any) {
      console.error('Send transaction error:', sendError)
      const errorMessage =
        sendError?.response?.data?.error || // API error structure
        sendError.message ||
        'An unknown error occurred during sending.'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      setSendStatus('error')
    } finally {
      setPassword('') // Clear password after attempt
    }
  }

  const handleSetPercentage = (percentage: number) => {
    if (availableBalance === null || availableBalance === undefined) return

    // TODO: Consider subtracting a small buffer for transaction fees, especially for SOL Max
    const calculatedAmount = availableBalance * percentage

    // Format based on token decimals
    const decimals = selectedToken === 'SOL' ? LAMPORTS_PER_SOL_DECIMALS : teamMintDecimals! // Use non-null assertion after check
    const formattedAmount = calculatedAmount.toFixed(decimals)

    // Avoid setting amount like 0.000000000 for very small balances
    setAmount(parseFloat(formattedAmount) > 0 ? formattedAmount : '0')
  }

  return (
    <View style={styles.container}>
      <Text preset='h3' style={styles.title}>
        Send Tokens
      </Text>

      {/* Custom Segmented Control */}
      {step !== 'confirm' && (
        <>
          <View style={styles.tokenSelectionContainer}>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentButton, selectedToken === 'SOL' && styles.segmentButtonActive]}
                onPress={() => setSelectedToken('SOL')}
              >
                <Text style={[styles.segmentText, selectedToken === 'SOL' && styles.segmentTextActive]}>SOL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, selectedToken === 'TEAM' && styles.segmentButtonActive]}
                onPress={() => setSelectedToken('TEAM')}
              >
                <Text style={[styles.segmentText, selectedToken === 'TEAM' && styles.segmentTextActive]}>TEAM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text preset='caption' style={styles.balanceLabel}>
              Available Balance:
            </Text>
            {/* Ensure teamMintDecimals is not null before using */}
            <Text preset='label' style={styles.balanceAmount}>
              {availableBalance?.toFixed(selectedToken === 'SOL' ? 4 : (teamMintDecimals ?? 2)) ?? '0.00'} {selectedToken}
            </Text>
          </View>
        </>
      )}

      {step === 'form' && (
        <>
          <View style={styles.formSection}>
            <Input
              label='Recipient Address'
              placeholder='Enter SOL address'
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              autoCapitalize='none'
              style={[genericStyles.input, styles.input]}
              // TODO: Add address validation
            />
          </View>

          <View style={styles.formSection}>
            <View style={styles.amountContainer}>
              <Input
                label={`Amount (${selectedToken})`}
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
                variant={
                  amount &&
                  availableBalance !== null &&
                  amount === (availableBalance * 0.25).toFixed(selectedToken === 'SOL' ? LAMPORTS_PER_SOL_DECIMALS : (teamMintDecimals ?? 2))
                    ? 'primary'
                    : 'outline'
                }
                style={styles.percentageButton}
              />
              <Button
                title='50%'
                onPress={() => handleSetPercentage(0.5)}
                variant={
                  amount &&
                  availableBalance !== null &&
                  amount === (availableBalance * 0.5).toFixed(selectedToken === 'SOL' ? LAMPORTS_PER_SOL_DECIMALS : (teamMintDecimals ?? 2))
                    ? 'primary'
                    : 'outline'
                }
                style={styles.percentageButton}
              />
              <Button
                title='75%'
                onPress={() => handleSetPercentage(0.75)}
                variant={
                  amount &&
                  availableBalance !== null &&
                  amount === (availableBalance * 0.75).toFixed(selectedToken === 'SOL' ? LAMPORTS_PER_SOL_DECIMALS : (teamMintDecimals ?? 2))
                    ? 'primary'
                    : 'outline'
                }
                style={styles.percentageButton}
              />
              <Button
                title='Max'
                onPress={() => handleSetPercentage(1.0)}
                variant={
                  amount &&
                  availableBalance !== null &&
                  amount === (availableBalance * 1.0).toFixed(selectedToken === 'SOL' ? LAMPORTS_PER_SOL_DECIMALS : (teamMintDecimals ?? 2))
                    ? 'primary'
                    : 'outline'
                }
                style={styles.percentageButton}
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actionButtonsContainer}>
            <Button title='Cancel' onPress={onClose} variant='secondary' style={styles.button} />
            <Button
              title='Next'
              onPress={handleSend}
              variant='primary'
              style={styles.button}
              disabled={!recipientAddress || !amount}
            />
          </View>
        </>
      )}

      {step === 'confirm' && (
        <>
          <View style={styles.confirmationSection}>
            <Text preset='paragraph' style={styles.confirmationText}>
              Enter your password to confirm sending
            </Text>
            <Text preset='h4' style={styles.confirmationAmount}>
              {amount} {selectedToken}
            </Text>
            <Text preset='paragraph' style={styles.confirmationText}>
              to <Text preset='label'>{recipientAddress}</Text>.
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
              disabled={sendStatus === 'sending'}
            />
            <Button
              title={sendStatus === 'sending' ? 'Sending...' : 'Confirm Send'}
              onPress={handlePasswordSubmit}
              style={{ flex: 1, marginLeft: 5 }}
              disabled={sendStatus === 'sending' || !password}
              leftIcon={
                sendStatus === 'sending' ? <ActivityIndicator size='small' color={Colors.background} /> : undefined
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
  formSection: {
    marginBottom: 12
  },
  amountContainer: {
    gap: 10
  },
  actionButtonsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundDark, // Add a separator line
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  button: {
    flex: 1 // Make buttons share space
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
    marginBottom: 8 // Add space above the error message
  },
  percentageButton: {
    flex: 1, // Make buttons share space
    marginHorizontal: 2, // Add small horizontal gap between buttons
    paddingVertical: 8, // Adjust vertical padding for smaller buttons
    height: 'auto', // Let height be determined by content
    minHeight: 32 // Ensure a minimum tap area
  },
  // Styles for custom Segmented Control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    overflow: 'hidden', // Ensures children adhere to border radius
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
    backgroundColor: Colors.tint // Active background color
  },
  segmentText: {
    color: Colors.icon, // Use icon color for inactive text
    fontSize: 14,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: Colors.tabIconSelected // Use tabIconSelected for white
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

export default SendDrawerContent
