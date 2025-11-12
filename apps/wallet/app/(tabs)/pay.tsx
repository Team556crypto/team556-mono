import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Button, Text, Alert, Platform, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '@/constants/Colors';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult, PermissionStatus } from 'expo-camera'; 
import { PublicKey, Connection, Transaction, TransactionInstruction, ConnectionConfig, Commitment, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useDrawerStore } from '@/store/drawerStore';
import { signTransaction, sendTransaction, sendWebhook } from '@/services/api';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { parseURL, TransferRequestURL } from '@solana/pay';
import { Buffer } from 'buffer'; // Add missing Buffer import
import { PaymentReceiptDrawerContent } from '@/components/drawers/payments/PaymentReceiptDrawerContent';
import ConfirmPaymentDrawerContent from '@/components/drawers/payments/ConfirmPaymentDrawerContent';

const TEAM556_MINT_ADDRESS = new PublicKey('AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5');

// Build a resilient list of RPC endpoints. Prefer keys from env but fall back to
// CORS-enabled public endpoints so the web build works without secrets.
// Base URL for the Go main-api (already used throughout the app via apiClient).
const MAIN_API_BASE = process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL || 'http://localhost:3000/api';

// The proxy route that forwards JSON-RPC calls to Solana nodes; the server keeps private keys.
const PROXY_RPC_ENDPOINT = `${MAIN_API_BASE}/solana/rpc`;

// Always try the main-api proxy first (and usually only). If it ever fails we can
// optionally add public fallbacks, but per requirement this should proxy ALL calls.
const RPC_ENDPOINTS: string[] = [PROXY_RPC_ENDPOINT];

async function createResilientConnection(endpoints: string[]): Promise<Connection> {
  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: undefined, // Disable WebSocket to avoid CORS issues with proxy
      });
      // Perform a quick version check to ensure the endpoint is responsive
      await connection.getVersion();
      console.log(`Successfully connected to RPC endpoint: ${endpoint}`);
      return connection;
    } catch (error) {
      console.warn(`Failed to connect to RPC endpoint: ${endpoint}. Trying next...`);
    }
  }
  throw new Error('Failed to connect to any available RPC endpoints.');
}

interface PaymentDetails {
    recipient: PublicKey;
    amount: BigNumber | undefined;
    label?: string;
    message?: string;
    /**
     * Webhook callback URL provided by the merchant. The wallet should POST the
     * transaction signature to this URL after payment confirmation so the
     * merchant site (e.g., Team556 Pay WordPress plugin) can mark the order
     * as paid.
     */
    webhookUrl?: string;
}

export default function PayScreen() {
  const { user, token, isLoading: isLoadingAuth } = useAuthStore();
    const { showToast } = useToastStore();
  const { openDrawer, closeDrawer } = useDrawerStore();
  const router = useRouter();
  
  // Calculate this explicitly within component for debugging
  const isP1PresaleUser = !!user && user.presale_type === 1;
  
  // Detailed debugging


  // More aggressive immediate check and redirect
  useEffect(() => {

    
    if ((!isLoadingAuth && !isP1PresaleUser) || (!isLoadingAuth && !user)) {

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
  
  const [manualUrlInput, setManualUrlInput] = useState(''); 
  
  // State for payment receipt
  const [showReceipt, setShowReceipt] = useState(false);
  


  useEffect(() => {
    if (Platform.OS !== 'web' && permission && permission.status === PermissionStatus.UNDETERMINED) {
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

        // Extract the optional webhook callback URL from the *raw* URL string. The
        // `@solana/pay` parser drops unknown query parameters like `url=` so we
        // must manually parse it before calling `parseURL`.
        let webhookUrl: string | undefined;
        const urlMatch = correctedData.match(/[?&]url=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
            try {
                webhookUrl = decodeURIComponent(urlMatch[1]);
                console.log('Extracted webhook URL:', webhookUrl);
            } catch (decodeErr) {
                console.warn('Failed to decode webhook URL', decodeErr);
            }
        }

            if (parsed.splToken && parsed.splToken.equals(TEAM556_MINT_ADDRESS)) {
          const details: PaymentDetails = {
               recipient: parsed.recipient,
               amount: parsed.amount,
               label: parsed.label,
               message: parsed.message,
               webhookUrl,
           };
          openDrawer(
              <ConfirmPaymentDrawerContent
                  onClose={closeDrawer}
                  onConfirm={(password: string) => handleConfirmPayment(details, password)}
                  paymentDetails={details}
              />
          );
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

      const handleConfirmPayment = async (paymentDetails: PaymentDetails, password: string) => {
    closeDrawer();
        if (!token || !user || !user.wallets || user.wallets.length === 0) {
      Alert.alert('Error', 'Missing payment details or user information.');
      return;
    }

    const senderWallet = user.wallets[0];
    const senderPublicKey = new PublicKey(senderWallet.address);
        const recipientPublicKey = paymentDetails.recipient;


        if (!password) {
      Alert.alert('Error', 'Password is required to sign the transaction.');
      return;
    }

    try {
      const connection = await createResilientConnection(RPC_ENDPOINTS);
          const senderTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            senderPublicKey
          );
          const recipientTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            recipientPublicKey
          );

          // Simplified retry function
          const getAccountInfoWithRetry = async (conn: Connection, account: PublicKey, retries = 3, initialDelay = 1000) => {
            let lastError;
            for (let i = 0; i < retries; i++) {
              try {
                return await conn.getAccountInfo(account);
              } catch (error) {
                console.warn(`Attempt ${i + 1} to get account info failed:`, error);
                lastError = error;
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw lastError || new Error('Failed to get account info after multiple attempts');
          };

          const recipientATAInfo = await getAccountInfoWithRetry(connection, recipientTokenAccount);

                    if (!paymentDetails.amount) {
            throw new Error('Payment amount details became unavailable.');
          }

          const decimals = parseInt(process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS || '9', 10);
                    const amountInLamports = new BigNumber(paymentDetails.amount).multipliedBy(Math.pow(10, decimals)).integerValue(BigNumber.ROUND_FLOOR);

          const transaction = new Transaction();
          const instructions = [];

          if (!recipientATAInfo) {
            instructions.push(
              createAssociatedTokenAccountInstruction(
                senderPublicKey,
                recipientTokenAccount,
                recipientPublicKey,
                TEAM556_MINT_ADDRESS
              )
            );
          }

          // Add a structured memo to identify this as a Team556 Pay transaction
          // and to store merchant information for display in transaction history.
          let transactionMemo = `Team556 Pay`;
          if (paymentDetails.label) {
            transactionMemo += ` | Business: ${paymentDetails.label}`;
          }
          if (paymentDetails.message) {
            transactionMemo += ` | Message: ${paymentDetails.message}`;
          }
          instructions.push(
            new TransactionInstruction({
              keys: [],
              programId: new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'),
              data: Buffer.from(transactionMemo, 'utf-8'),
            })
          );

          const transferAmount = BigInt(amountInLamports.toString());
          instructions.push(
            createTransferInstruction(
              senderTokenAccount,
              recipientTokenAccount,
              senderPublicKey,
              transferAmount,
              [],
              TOKEN_PROGRAM_ID
            )
          );
          
          transaction.add(...instructions);

          // Simplified retry function for blockhash
          const getBlockhashWithRetry = async (conn: Connection, retries = 3, initialDelay = 1000) => {
            let lastError;
            for (let i = 0; i < retries; i++) {
              try {
                return await conn.getLatestBlockhash('confirmed');
              } catch (error) {
                console.warn(`Attempt ${i + 1} to get blockhash failed:`, error);
                lastError = error;
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw lastError || new Error('Failed to get blockhash after multiple attempts');
          };


          const { blockhash, lastValidBlockHeight } = await getBlockhashWithRetry(connection);

          transaction.recentBlockhash = blockhash;
          transaction.feePayer = senderPublicKey;

          const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          const base64Transaction = serializedTransaction.toString('base64');


          const signResponse = await signTransaction(token, password, base64Transaction);
          const signedTxBase64 = signResponse.signedTransaction;

          // Send the signed transaction through the main API instead of direct RPC
          const sendResponse = await sendTransaction(token, signedTxBase64);
          
          if (!sendResponse.success) {
            throw new Error('Transaction failed to send or confirm');
          }
          
          const signature = sendResponse.signature;
          showToast(`Payment successful!`, 'success', 3000);

            // Send webhook callback so the merchant site can confirm the payment
                        if (paymentDetails.webhookUrl) {
              try {
                                await sendWebhook(token, paymentDetails.webhookUrl, signature);
                console.log('Webhook POST sent via proxy to', paymentDetails.webhookUrl);
              } catch (webhookErr) {
                console.warn('Failed to send payment webhook', webhookErr);
              }
            }

                              closeDrawer(); // Close the confirmation drawer
          openDrawer(
            <PaymentReceiptDrawerContent
              amount={paymentDetails.amount.toString()}
              recipient={recipientPublicKey.toBase58()}
              recipientLabel={paymentDetails.label}
              message={paymentDetails.message}
              signature={signature}
              timestamp={new Date()}
              onClose={() => {
                closeDrawer();
                router.push('/');
              }}
            />
          );
          setShowReceipt(true);

        } catch (error: any) {
          console.error('[PayScreen.handleConfirmPayment] Payment failed. Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          let userErrorMessage = 'An unknown error occurred during payment.';
          if (error.message) {
            if (error.message.includes('RPC') || error.message.includes('Network request failed') || error.message.includes('blockhash')) {
              userErrorMessage = 'Network connection error. Please check your internet connection and try again.';
            } else if (error.message.includes('insufficient funds')) {
              userErrorMessage = 'Insufficient funds for this transaction.';
            } else if (error.message.includes('password')) {
              userErrorMessage = 'Invalid password.';
            } else {
              userErrorMessage = error.message;
            }
          }
                Alert.alert('Payment Failed', userErrorMessage);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setManualUrlInput('');
    setScanned(false);
    router.push('/');
  };

  // Conditional rendering for receipt, payment confirmation, or main pay screen
  // Removed the old PaymentReceipt component

  // This is the main QR scanner / manual input screen
  return (
    <ScreenLayout 
      title='Pay' 
      headerIcon={<Ionicons name='card' size={24} color={Colors.primary} />}
      contentContainerStyle={styles.contentContainer}
    >
      <Head>
        <title>Pay with TEAM | Team556 Wallet</title>
      </Head>

      {/* Welcome Section - Card Style */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name='card-outline' size={32} color={Colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>Team556 Pay</Text>
        <Text style={styles.welcomeTagline}>
          Pay at your favorite firearm businesses that accept Team556
        </Text>
      </View>

      {/* Scanner Section */}
      {Platform.OS !== 'web' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name='qr-code-outline' size={20} color={Colors.text} />
            <Text style={styles.sectionTitle}>Scan QR Code</Text>
          </View>
          <View style={styles.scannerCard}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} 
              barcodeScannerSettings={{
                barcodeTypes: ['qr'], 
              }}
              style={styles.cameraView}
            />
          </View>
        </View>
      )}

      {/* Manual Input Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name='link-outline' size={20} color={Colors.text} />
          <Text style={styles.sectionTitle}>Enter Payment URL</Text>
        </View>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Paste Team556 Pay URL here"
            placeholderTextColor={Colors.textTertiary} 
            value={manualUrlInput}
            onChangeText={setManualUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmitManualUrl}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
            <Ionicons name='arrow-forward' size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 20,
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
  // Welcome Card
  welcomeCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text, 
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeTagline: { 
    fontSize: 14,
    color: Colors.textSecondary, 
    textAlign: 'center',
    lineHeight: 20,
  },
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Scanner Card
  scannerCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  cameraView: {
    flex: 1,
  },
  // Input Card
  inputCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    color: Colors.text,
    backgroundColor: Colors.backgroundDark,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Legacy confirmation styles (kept for drawer components)
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
