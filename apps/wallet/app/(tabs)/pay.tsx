import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Button, Text, Alert, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '@/constants/Colors';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult, PermissionStatus } from 'expo-camera'; 
import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { useAuthStore } from '@/store/authStore';
import { signTransaction } from '@/services/api';
import { Connection, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';
import { parseURL, TransferRequestURL } from '@solana/pay';

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
          const rpcEndpoint = process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT;
          if (!rpcEndpoint) {
            throw new Error('Solana RPC endpoint is not configured.');
          }
          const connection = new Connection(rpcEndpoint, 'confirmed');

          const senderTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            senderPublicKey
          );
          const recipientTokenAccount = await getAssociatedTokenAddress(
            TEAM556_MINT_ADDRESS,
            recipientPublicKey
          );

          if (!paymentDetails?.amount) {
            throw new Error('Payment amount details became unavailable.');
          }

          const decimals = 6; 
          const amountInLamports = paymentDetails.amount.multipliedBy(Math.pow(10, decimals)).integerValue(BigNumber.ROUND_FLOOR);

          if (amountInLamports.isLessThanOrEqualTo(0)) {
             throw new Error('Invalid payment amount.');
          }

          const transaction = new Transaction();
          const instructions = [];

          const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
          if (!recipientAccountInfo) {
            console.log(`Recipient ATA ${recipientTokenAccount.toBase58()} does not exist. Creating...`);
            instructions.push(
              createAssociatedTokenAccountInstruction(
                senderPublicKey,          // Payer
                recipientTokenAccount,    // ATA address
                recipientPublicKey,       // Owner
                TEAM556_MINT_ADDRESS      // Mint
              )
            );
          }

          instructions.push(
            createTransferInstruction(
              senderTokenAccount,       // Source ATA
              recipientTokenAccount,    // Destination ATA
              senderPublicKey,          // Owner of source ATA
              BigInt(amountInLamports.toString()), // Amount (needs to be BigInt for spl-token v0.3+)
              [],                       // Multi-signers (usually empty)
              TOKEN_PROGRAM_ID          // SPL Token Program ID
            )
          );

          transaction.add(...instructions);

          transaction.feePayer = senderPublicKey;
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;

          const serializedTransaction = transaction.serialize({
            requireAllSignatures: false, 
            verifySignatures: false,
          });
          const base64Transaction = serializedTransaction.toString('base64');

          const signResponse = await signTransaction(token, password, base64Transaction);
          const signedTxBase64 = signResponse.signedTransaction;

          const signedTxBytes = Buffer.from(signedTxBase64, 'base64');
          const signature = await connection.sendRawTransaction(signedTxBytes, {
             skipPreflight: false 
          });
          console.log('Transaction sent with signature:', signature);

          const confirmation = await connection.confirmTransaction({
                signature,
                blockhash, 
                lastValidBlockHeight: (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight 
            }, 'confirmed');

          if (confirmation.value.err) {
            console.error('Transaction confirmation error:', confirmation.value.err);
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }

          console.log('Transaction confirmed successfully!');
          Alert.alert('Success', `Payment of ${paymentDetails.amount.toString()} TEAM556 sent successfully!\nSignature: ${signature}`);

        } catch (error: any) {
          console.error('Payment failed:', error);
          Alert.alert('Payment Failed', error.message || 'An unknown error occurred during payment.');
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
