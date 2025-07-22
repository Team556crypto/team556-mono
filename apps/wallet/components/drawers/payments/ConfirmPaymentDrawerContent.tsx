import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Input } from '@team556/ui';
import { Colors } from '@/constants/Colors';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

type PaymentStatus = 'idle' | 'sending' | 'success' | 'error';

interface ConfirmPaymentDrawerProps {
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  paymentDetails: {
    recipient: PublicKey;
    amount: BigNumber | undefined;
    label?: string;
    message?: string;
  };
}

export const ConfirmPaymentDrawerContent: React.FC<ConfirmPaymentDrawerProps> = ({ onClose, onConfirm, paymentDetails }) => {
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (step === 'details') {
      setStep('confirm');
    } else {
      if (!password) {
        setError('Password is required.');
        return;
      }
      setError(null);
      setStatus('sending');
      try {
        await onConfirm(password);
        setStatus('success');
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
        setStatus('error');
      } finally {
        setPassword('');
      }
    }
  };

  return (
    <View style={styles.container}>
      {step === 'details' ? (
        <>
          <Text style={styles.title}>Confirm TEAM Payment</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>To: {paymentDetails.label ?? 'N/A'}</Text>
            <Text style={styles.recipient}>Recipient: {paymentDetails.recipient.toBase58()}</Text>
            <Text style={styles.amount}>Amount: {paymentDetails.amount?.toString() ?? '0'} TEAM</Text>
            <Text style={styles.message}>Message: {paymentDetails.message ?? 'No message provided'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} variant="secondary" style={styles.button} />
            <Button title="Confirm" onPress={handleConfirm} style={styles.button} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Enter Password to Sign</Text>
          <View style={styles.passwordContainer}>
            <Input
              label='Password'
              placeholder='Enter your password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize='none'
              autoFocus
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={() => setStep('details')}
              variant="secondary"
              style={styles.button}
              disabled={status === 'sending'}
            />
            <Button
              title={status === 'sending' ? 'Sending...' : 'Confirm & Sign'}
              onPress={handleConfirm}
              style={styles.button}
              disabled={status === 'sending' || !password}
              leftIcon={status === 'sending' ? <ActivityIndicator size='small' color={Colors.background} /> : undefined}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    marginVertical: 20,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 10,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  detailsContainer: {
    backgroundColor: Colors.backgroundDark,
    padding: 16,
    borderRadius: 10,
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
  },
  recipient: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 8,
  },
  message: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});

export default ConfirmPaymentDrawerContent;
