import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Button, Text, Alert, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '@/constants/Colors';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult, PermissionStatus } from 'expo-camera'; 
import { PublicKey, Connection, Transaction, ConnectionConfig, Commitment, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { useAuthStore } from '@/store/authStore';
import { signTransaction } from '@/services/api';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { parseURL, TransferRequestURL } from '@solana/pay';
import { Buffer } from 'buffer'; // Add missing Buffer import

const TEAM556_MINT_ADDRESS = new PublicKey('AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5');

interface PaymentDetails {
    recipient: PublicKey;
    amount: BigNumber | undefined; 
    label?: string;
    message?: string;
}

export default function PayScreen() {
  const { user, token, isLoading: isLoadingAuth } = useAuthStore();
  const router = useRouter();
  
  // Calculate this explicitly within component for debugging
  const isP1PresaleUser = !!user && user.presale_type === 1;
  
  // Detailed debugging
  console.log('[PayScreen] Auth State:', {
    isLoadingAuth,
    hasUser: !!user,
    presaleType: user?.presale_type,
    isP1PresaleUser
  });

  // More aggressive immediate check and redirect
  useEffect(() => {
    console.log('[PayScreen] Access check running, isP1PresaleUser:', isP1PresaleUser);
    
    if ((!isLoadingAuth && !isP1PresaleUser) || (!isLoadingAuth && !user)) {
      console.log('[PayScreen] Access denied! Redirecting to home');
      // Force navigation immediately
      router.replace('/');
      
      // If replace doesn't work, try push as a fallback
      setTimeout(() => {
        router.push('/');
      }, 100);
    }
  }, [isLoadingAuth, user, router]);

  // Force re-check on every render
  if (!isLoadingAuth && !isP1PresaleUser) {
    console.log('[PayScreen] Render blocked - not P1 user');
    // Return without rendering payment elements
    return (
      <ScreenLayout title='Access Denied' headerIcon={<Ionicons name='warning' size={24} color={Colors.error} />}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color={Colors.error} />
          <Text style={[styles.permissionDeniedText, {fontSize: 20, fontWeight: 'bold', marginVertical: 16}]}>
            Access Restricted
          </Text>
          <Text style={styles.permissionText}>
            The payment feature is only available to presale type 1 users.
          </Text>
          <View style={{marginTop: 20}}>
            <Button 
              onPress={() => router.replace('/')} 
              title="Return to Home" 
              color={Colors.primary}
            />
          </View>
        </View>
      </ScreenLayout>
    );
  }
  
  if (isLoadingAuth) {
    console.log('[PayScreen] Still loading auth state');
    return (
      <ScreenLayout title='Pay with TEAM' headerIcon={<Ionicons name='card' size={24} color={Colors.primary} />}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Loading...</Text>
        </View>
      </ScreenLayout>
    );
  }

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false); 
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [manualUrlInput, setManualUrlInput] = useState(''); 


  useEffect(() => {
    if (permission && permission.status === PermissionStatus.UNDETERMINED) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => { 
  setScanned(true); 
  console.log(`Processing URL: ${data} (Type: ${type})`);

  if (!data || !data.startsWith('solana:')) {
      Alert.alert('Invalid QR Code', 'This does not look like a Team556 Pay QR Code.');
      return;
  }

  // Attempt to correct a common manual input error: solana:recipient=ADDRESS...
  let correctedData = data;
  const recipientPrefix = 'solana:recipient=';
  if (data.startsWith(recipientPrefix)) {
    let addressAndParams = data.substring(recipientPrefix.length);
    const ampersandIndex = addressAndParams.indexOf('&');
    
    if (ampersandIndex !== -1) {
      const addressPart = addressAndParams.substring(0, ampersandIndex);
      const paramsPart = addressAndParams.substring(ampersandIndex + 1);
      correctedData = `solana:${addressPart}?${paramsPart}`;
    } else {
      // No parameters, just the address
      correctedData = `solana:${addressAndParams}`;
    }
    console.log(`Attempted correction for manual input: ${correctedData}`);
  }

  try {
      const parsed = parseURL(correctedData) as TransferRequestURL; 
      console.log('Parsed Team556 Pay URL:', parsed);

      if (parsed.splToken && parsed.splToken.equals(TEAM556_MINT_ADDRESS)) {
          setPaymentDetails({
              recipient: parsed.recipient,
              amount: parsed.amount,
              label: parsed.label,
              message: parsed.message
          });
      } else if (parsed.splToken) {
           Alert.alert('Invalid Token', `This request is for a different token, not TEAM556. (${parsed.splToken.toBase58()})`);
      } else {
          Alert.alert('Unsupported Request', 'This QR code does not represent a TEAM556 payment request.');
      }
  } catch (error) {
      console.error("Input data that caused parsing error (original input):", data); // Log the problematic data
      console.error("Error parsing Team556 Pay URL:", error);
      Alert.alert('Error', 'Could not parse the Team556 Pay QR Code.');
  }
};

  const handleSubmitManualUrl = () => {
    if (manualUrlInput.trim()) {
      handleBarCodeScanned({ data: manualUrlInput.trim(), type: 'manual_input' } as BarcodeScanningResult);
      setManualUrlInput(''); 
    } else {
      Alert.alert('No URL Entered', 'Please enter or paste a valid Team556 Pay URL.');
    }
  };

  const handleConfirmPayment = async () => {
    console.log('[PayScreen.handleConfirmPayment] Clicked. Checking conditions...');
    console.log('[PayScreen.handleConfirmPayment] paymentDetails:', paymentDetails);
    console.log('[PayScreen.handleConfirmPayment] token:', token);
    console.log('[PayScreen.handleConfirmPayment] user:', user);
    console.log('[PayScreen.handleConfirmPayment] user.wallets:', user?.wallets);

    if (!paymentDetails || !token || !user || !user.wallets || user.wallets.length === 0) {
      Alert.alert('Error', 'Missing payment details or user information.');
      return;
    }

    const senderWallet = user.wallets[0]; 
    const senderPublicKey = new PublicKey(senderWallet.address);
    const recipientPublicKey = paymentDetails.recipient; 
    const message = paymentDetails.message; 

    Alert.prompt(
      'Confirm Transaction',
      'Please enter your password to sign the transaction.',
      async (password) => {
        if (!password) {
          Alert.alert('Error', 'Password is required to sign the transaction.');
          return;
        }

        try {
          console.log('[PayScreen.handleConfirmPayment] Processing payment within try block. Current paymentDetails:', JSON.stringify(paymentDetails, (key, value) => {
          if (value instanceof PublicKey) return value.toBase58();
          if (value instanceof BigNumber) return value.toString();
          // Add other custom types if needed, e.g., for BigInt if not handled by default JSON.stringify
          if (typeof value === 'bigint') return value.toString(); 
          return value;
        }, 2));
          const rpcEndpoint = 'https://api.mainnet-beta.solana.com'; // Switch to reliable official Solana RPC
          if (!rpcEndpoint) {
            throw new Error('Solana RPC endpoint is not configured.');
          }
          
          console.log('[PayScreen.handleConfirmPayment] Original RPC Endpoint:', rpcEndpoint);
          
          // Create connection with retry options
          const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000, // 60 seconds
            disableRetryOnRateLimit: false,
          });
        
          // Create backup connections to GenesysGo, QuickNode, and other providers if available
          const backupEndpoints = [
            process.env.EXPO_PUBLIC_GLOBAL__BACKUP_RPC_URL_1 || 'https://crystaleyes.spl_gdn.api.mainnet-beta.solana.com',
            process.env.EXPO_PUBLIC_GLOBAL__BACKUP_RPC_URL_2 || 'https://api.mainnet-beta.solana.com',
            process.env.EXPO_PUBLIC_GLOBAL__BACKUP_RPC_URL_3 || 'https://spl_gdn.dsril.com',
          ];
          const backupConnections = backupEndpoints.map((endpoint) => endpoint ? new Connection(endpoint, 'confirmed') : null).filter(Boolean) as Connection[];

          // Add a small delay to allow network to initialize properly
          // This sometimes helps in React Native with connection stability
          await new Promise(resolve => setTimeout(resolve, 100));

          console.log('[PayScreen.handleConfirmPayment] Getting sender token account...');
          const senderTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            senderPublicKey
          );
          console.log('[PayScreen.handleConfirmPayment] Sender token account:', senderTokenAccount.toBase58());

          console.log('[PayScreen.handleConfirmPayment] Getting recipient token account...');
          const recipientTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            recipientPublicKey
          );
          console.log('[PayScreen.handleConfirmPayment] Recipient token account:', recipientTokenAccount.toBase58());

          // Check if recipient ATA exists
          let recipientATAInfo;
          let successfulConnection = connection; // Track which connection worked
          const getAccountInfoWithRetry = async (connection: Connection, retries = 3, initialDelay = 1000) => {
            let lastError;
            for (let i = 0; i < retries; i++) {
              try {
                console.log(`[PayScreen.handleConfirmPayment] Attempt ${i+1} to get account info...`);
                recipientATAInfo = await connection.getAccountInfo(recipientTokenAccount);
                console.log('[PayScreen.handleConfirmPayment] Recipient ATA info retrieved:', recipientATAInfo);
                return recipientATAInfo;
              } catch (error) {
                console.error(`[PayScreen.handleConfirmPayment] Attempt ${i+1} failed:`, error);
                lastError = error;
                // Wait with exponential backoff before retry
                const delay = initialDelay * Math.pow(2, i);
                console.log(`[PayScreen.handleConfirmPayment] Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw lastError || new Error('Failed to get account info after multiple attempts');
          };

          try {
            // Try primary connection with retry
            console.log('[PayScreen.handleConfirmPayment] Getting account info with retry mechanism...');
            recipientATAInfo = await getAccountInfoWithRetry(connection);
            console.log('[PayScreen.handleConfirmPayment] Successfully used primary RPC connection:', rpcEndpoint);
          } catch (primaryError) {
            console.error('[PayScreen.handleConfirmPayment] Primary RPC connection failed after retries:', primaryError);
            
            // Try backup connections if available
            for (const backupConnection of backupConnections) {
              console.log('[PayScreen.handleConfirmPayment] Falling back to backup RPC endpoint...');
              try {
                recipientATAInfo = await getAccountInfoWithRetry(backupConnection);
                successfulConnection = backupConnection; // Use this connection for sending
                console.log('[PayScreen.handleConfirmPayment] Successfully used backup RPC connection:', backupConnection.rpcEndpoint);
                break;
              } catch (backupError) {
                console.error('[PayScreen.handleConfirmPayment] Backup RPC also failed:', backupError);
              }
            }
            if (!recipientATAInfo) {
              throw new Error('Network connection error. Please check your internet connection and try again.');
            }
          }

          if (!recipientATAInfo) {
            console.log('[PayScreen.handleConfirmPayment] Recipient ATA does not exist, adding create ATA instruction to main transaction...');
          }

          if (!paymentDetails?.amount) {
            throw new Error('Payment amount details became unavailable.');
          }

          const decimals = parseInt(process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS || '9', 10); // TEAM556 token decimals from env
          const amountInLamports = new BigNumber(paymentDetails.amount).multipliedBy(Math.pow(10, decimals)).integerValue(BigNumber.ROUND_FLOOR);
          
          console.log('[PayScreen.handleConfirmPayment] Amount conversion: original=', paymentDetails.amount, 'lamports=', amountInLamports.toString());

          console.log('[PayScreen.handleConfirmPayment] Building transaction with createTransfer...');
          const transaction = new Transaction();
          const instructions = [];

          // Add create ATA instruction if needed (must come before transfer)
          if (!recipientATAInfo) {
            console.log('[PayScreen.handleConfirmPayment] Adding create ATA instruction...');
            instructions.push(
              createAssociatedTokenAccountInstruction(
                senderPublicKey,          // Payer
                recipientTokenAccount,    // ATA address
                recipientPublicKey,       // Owner
                TEAM556_MINT_ADDRESS      // Mint
              )
            );
          }

          // Add transfer instruction
          const transferAmount = BigInt(amountInLamports.toString());
          console.log('[PayScreen.handleConfirmPayment] Transfer amount as BigInt:', transferAmount.toString());
          console.log('[PayScreen.handleConfirmPayment] Creating transfer instruction with:');
          console.log('  - From:', senderTokenAccount.toBase58());
          console.log('  - To:', recipientTokenAccount.toBase58());
          console.log('  - Owner:', senderPublicKey.toBase58());
          console.log('  - Amount (BigInt):', transferAmount.toString());
          
          instructions.push(
            createTransferInstruction(
              senderTokenAccount,       // Source ATA
              recipientTokenAccount,    // Destination ATA
              senderPublicKey,          // Owner of source ATA
              transferAmount,           // Amount as BigInt
              [],                       // Multi-signers (usually empty)
              TOKEN_PROGRAM_ID          // SPL Token Program ID
            )
          );
          console.log('[PayScreen.handleConfirmPayment] Added transfer instruction');
          
          // Add instructions to the transaction
          transaction.add(...instructions);
          
          // Get latest blockhash using direct JSON-RPC call to bypass potential Connection issues
          console.log('[PayScreen.handleConfirmPayment] Getting latest blockhash for transaction...');
          
          let blockhash, lastValidBlockHeight;
          let successfulConnectionForBlockhash = connection; // Track which connection worked
        
          // Function to try getting blockhash with exponential backoff
          const getBlockhashWithRetry = async (connection: Connection, retries = 3, initialDelay = 1000) => {
            let lastError;
            for (let i = 0; i < retries; i++) {
              try {
                console.log(`[PayScreen.handleConfirmPayment] Attempt ${i+1} to get blockhash...`);
                const result = await connection.getLatestBlockhash('confirmed');
                console.log('[PayScreen.handleConfirmPayment] Blockhash retrieved:', result.blockhash);
                return result;
              } catch (error) {
                console.error(`[PayScreen.handleConfirmPayment] Attempt ${i+1} failed:`, error);
                lastError = error;
                // Wait with exponential backoff before retry
                const delay = initialDelay * Math.pow(2, i);
                console.log(`[PayScreen.handleConfirmPayment] Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw lastError || new Error('Failed to get blockhash after multiple attempts');
          };

          try {
            // Try primary connection with retry
            console.log('[PayScreen.handleConfirmPayment] Getting latest blockhash with retry mechanism...');
            const result = await getBlockhashWithRetry(connection);
            blockhash = result.blockhash;
            lastValidBlockHeight = result.lastValidBlockHeight;
            console.log('[PayScreen.handleConfirmPayment] Successfully used primary RPC connection:', rpcEndpoint);
          } catch (primaryError) {
            console.error('[PayScreen.handleConfirmPayment] Primary RPC connection failed after retries:', primaryError);
            
            // Try backup connections if available
            for (const backupConnection of backupConnections) {
              console.log('[PayScreen.handleConfirmPayment] Falling back to backup RPC endpoint...');
              try {
                const result = await getBlockhashWithRetry(backupConnection);
                blockhash = result.blockhash;
                lastValidBlockHeight = result.lastValidBlockHeight;
                successfulConnectionForBlockhash = backupConnection; // Use this connection for sending
                console.log('[PayScreen.handleConfirmPayment] Successfully used backup RPC connection:', backupConnection.rpcEndpoint);
                break;
              } catch (backupError) {
                console.error('[PayScreen.handleConfirmPayment] Backup RPC also failed:', backupError);
              }
            }
            if (!blockhash) {
              throw new Error('Network connection error. Please check your internet connection and try again.');
            }
          }
        
          console.log('[PayScreen.handleConfirmPayment] Latest blockhash for transaction:', blockhash, 'LastValidBlockHeight:', lastValidBlockHeight);
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = senderPublicKey;
          console.log('[PayScreen.handleConfirmPayment] Transaction built. Instructions count:', transaction.instructions.length);
        
          if (transaction.instructions.length > 0) {
            console.log('[PayScreen.handleConfirmPayment] First instruction program ID:', transaction.instructions[0].programId.toBase58());
          }

          console.log('[PayScreen.handleConfirmPayment] Serializing transaction...');
          const serializedTransaction = transaction.serialize({
            requireAllSignatures: false, 
            verifySignatures: false,
          });
          const base64Transaction = serializedTransaction.toString('base64');

          console.log('[PayScreen.handleConfirmPayment] Signing transaction...');
          const signResponse = await signTransaction(token, password, base64Transaction);
          const signedTxBase64 = signResponse.signedTransaction;

          const signedTxBytes = Buffer.from(signedTxBase64, 'base64');
          console.log('[PayScreen.handleConfirmPayment] Transaction signed by backend/service. Signed TX length:', signedTxBytes.length);
          console.log('[PayScreen.handleConfirmPayment] Raw signed transaction bytes ready. Length:', signedTxBytes.length);
          console.log('[PayScreen.handleConfirmPayment] Sending raw transaction...');
          const signature = await successfulConnectionForBlockhash.sendRawTransaction(signedTxBytes, {
           skipPreflight: false 
        });
        console.log('[PayScreen.handleConfirmPayment] Raw transaction sent. Signature:', signature);

        if (lastValidBlockHeight) {
          // The blockhash used for sending and confirming should be the one set in transaction.recentBlockhash
          // However, confirmTransaction also takes lastValidBlockHeight which we fetched with that blockhash.
          // So, we use the 'blockhash' and 'lastValidBlockHeight' variables obtained before signing.

          console.log('[PayScreen.handleConfirmPayment] Confirming transaction with signature:', signature);
          
          try {
            // Explicitly set timeout to avoid waiting indefinitely
            const confirmationResult = await Promise.race([
              successfulConnectionForBlockhash.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timed out')), 60000))
            ]);
            
            console.log('[PayScreen.handleConfirmPayment] Transaction confirmation result:', JSON.stringify(confirmationResult, null, 2));
          // Check if there was a transaction error
          // TypeScript safe check for confirmation result structure
          const confirmValue = confirmationResult as { value?: { err?: any } };
          if (confirmValue?.value?.err) {
            throw new Error(`Transaction confirmation failed: ${JSON.stringify(confirmValue.value.err)}`);
          }

            console.log('Transaction confirmed successfully!');
            Alert.alert('Success', `Payment of ${paymentDetails.amount.toString()} TEAM556 sent successfully!\nSignature: ${signature}`);
          } catch (confirmError) {
            console.error('[PayScreen.handleConfirmPayment] Transaction confirmation error:', confirmError);
            // Transaction might still be successful even if confirmation times out
            Alert.alert(
              'Payment Status Unknown', 
              `Your payment of ${paymentDetails.amount.toString()} TEAM556 was sent, but confirmation timed out. ` +
              `Check your balance later to verify. Transaction signature: ${signature}`
            );
          }
        } else {
          console.log('Transaction sent but confirmation failed due to missing lastValidBlockHeight.');
          Alert.alert(
            'Payment Status Unknown', 
            `Your payment of ${paymentDetails.amount.toString()} TEAM556 was sent, but confirmation failed. ` +
            `Check your balance later to verify. Transaction signature: ${signature}`
          );
        }

      } catch (error: any) {
      console.error('[PayScreen.handleConfirmPayment] Payment failed. Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('[PayScreen.handleConfirmPayment] Error Name:', error.name, 'Message:', error.message, 'Stack:', error.stack);
      
      // More user-friendly error messages
      let userErrorMessage = 'An unknown error occurred during payment.';
      if (error.message) {
        if (error.message.includes('Network request failed') || error.message.includes('blockhash')) {
          userErrorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('insufficient funds')) {
          userErrorMessage = 'Insufficient funds for this transaction.';
        } else if (error.message.includes('Transaction simulation failed')) {
          userErrorMessage = 'Transaction simulation failed. The recipient account may not exist or there may be an issue with the transaction.';
        } else {
          userErrorMessage = error.message;
        }
      }
      
      Alert.alert('Payment Failed', userErrorMessage);
    } finally {
        setPaymentDetails(null); 
      }
    },
    Platform.OS === 'ios' ? 'secure-text' : 'default', 
    '', 
    'default' 
  );
};

  const handleCancelPayment = () => {
      console.log('Payment Cancelled');
      setPaymentDetails(null); 
  }

  if (!permission) {
    return <View />; 
  }

  if (!permission.granted) {
    return (
      <ScreenLayout title='Pay with TEAM' headerIcon={<Ionicons name='card' size={24} color={Colors.primary} />}>
        <View style={styles.centered}> 
          <Text style={styles.permissionText}>We need your permission to use the camera for scanning.</Text>
          <Button onPress={requestPermission} title="Grant Camera Permission" color={Colors.primary} />
          {permission.canAskAgain === false && <Text style={styles.permissionDeniedText}>Camera permission denied. Please enable it in your device settings.</Text> }
        </View>
      </ScreenLayout>
    );
  }

  if (paymentDetails) {
      return (
          <ScreenLayout title='Confirm Payment' headerIcon={<Ionicons name='card' size={24} color={Colors.primary} />}>
              <View style={styles.centered}>
                  <Text style={styles.confirmTitle}>Confirm TEAM Payment</Text>
                  {paymentDetails.label && <Text style={styles.confirmLabel}>To: {paymentDetails.label}</Text>}
                  <Text style={styles.confirmRecipient}>Recipient: {paymentDetails.recipient.toBase58()}</Text>
                  <Text style={styles.confirmAmount}>
                      Amount: {paymentDetails.amount ? paymentDetails.amount.toString() + ' TEAM' : 'Default Amount'}
                  </Text>
                  {paymentDetails.message && <Text style={styles.confirmMessage}>Message: {paymentDetails.message}</Text>}
                  <View style={styles.buttonRow}>
                       <Button title="Cancel" onPress={handleCancelPayment} color={Colors.error} />
                       <Button title="Confirm & Send" onPress={handleConfirmPayment} color={Colors.primary} />
                  </View>
              </View>
          </ScreenLayout>
      )
  }

  return (
    <ScreenLayout title='Pay with TEAM' headerIcon={<Ionicons name='card' size={24} color={Colors.primary} />}>
      <Head>
        <title>Pay with TEAM | Team556 Wallet</title>
      </Head>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps='handled' 
      >
        <Text style={styles.welcomeTitle}>Welcome to Team556 Pay</Text>
        <Text style={styles.welcomeTagline}>
            Use Team556 to pay at your favorite firearm business that accepts Team556.
        </Text>
        
        <View style={styles.scannerOuterContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} 
            barcodeScannerSettings={{
              barcodeTypes: ['qr'], 
            }}
            style={styles.cameraView}
          />
        </View>

        <Text style={styles.manualInputLabel}>Or enter/paste Team556 Pay URL:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="(Team556 Pay URL)"
            placeholderTextColor={Colors.textSecondary} 
            value={manualUrlInput}
            onChangeText={setManualUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.submitButtonContainer}>
            <Button title="Submit" onPress={handleSubmitManualUrl} color={Colors.primary}/>
          </View>
        </View>
        
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background, 
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',     
    paddingVertical: 20,
  },
  centered: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%', 
    backgroundColor: Colors.background, 
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionDeniedText: {
    marginTop: 10,
    color: Colors.error, 
    textAlign: 'center',
  },
  welcomeTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text, 
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeTagline: { 
    fontSize: 16,
    color: Colors.textSecondary, 
    textAlign: 'center',
    marginBottom: 20, 
    paddingHorizontal: 20, 
  },
  scannerOuterContainer: { 
    width: '90%',
    aspectRatio: 1, 
    maxWidth: 400, 
    overflow: 'hidden', 
    borderRadius: 10, 
    marginBottom: 20,
    borderWidth: 1, 
    borderColor: Colors.secondary, 
  },
  cameraView: {
    flex: 1, 
  },
  manualInputLabel: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'column', 
    alignItems: 'center', 
    width: '90%',
    maxWidth: 450,
    marginBottom: 20,
  },
  textInput: {
    width: '100%', 
    height: 45,
    borderColor: Colors.secondary, 
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15, 
    color: Colors.text, 
    backgroundColor: Colors.backgroundLight, 
  },
  submitButtonContainer: { 
    width: '60%', 
    maxWidth: 250, 
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.text,
  },
  confirmLabel: {
     fontSize: 16,
     marginBottom: 5,
     color: Colors.text,
  },
  confirmRecipient: {
    fontSize: 14,
    marginBottom: 15,
    color: Colors.textSecondary, 
    textAlign: 'center',
  },
  confirmAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
     color: Colors.text,
  },
  confirmMessage: {
     fontSize: 14,
     marginBottom: 25,
     fontStyle: 'italic',
     color: Colors.textSecondary,
     textAlign: 'center',
  },
  buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around', 
      width: '100%', 
      marginTop: 20,
  }
});
