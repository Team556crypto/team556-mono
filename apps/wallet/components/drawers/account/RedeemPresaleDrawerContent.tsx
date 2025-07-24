import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Input, Text } from '@team556/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { checkPresaleCode, redeemPresaleCode } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { genericStyles } from '@/constants/GenericStyles';

interface RedeemPresaleDrawerContentProps {
  onClose: () => void;
}

const RedeemPresaleDrawerContent: React.FC<RedeemPresaleDrawerContentProps> = ({ onClose }) => {
  const { token, fetchAndUpdateUser } = useAuthStore();
  const [presaleCode, setPresaleCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [codeType, setCodeType] = useState<number | null>(null);
  const [isWalletInputVisible, setIsWalletInputVisible] = useState(false);
  const [canRedeem, setCanRedeem] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleCheckCode = useCallback(async () => {
    if (!presaleCode) {
      setMessage('Please enter a presale code.');
      setMessageType('error');
      return;
    }

    setIsChecking(true);
    setMessage(null);
    setMessageType(null);
    setCanRedeem(false);
    setIsWalletInputVisible(false);
    setCodeType(null);

    const response = await checkPresaleCode(presaleCode.toUpperCase(), token);

    if (response.isValid && !response.redeemed) {
      setMessage(response.message);
      setMessageType('success');
      setCanRedeem(true);
      setCodeType(response.type ?? null);
      if (response.type === 2) {
        setIsWalletInputVisible(true);
      }
    } else {
      setMessage(response.message);
      setMessageType('error');
      setCanRedeem(false);
    }

    setIsChecking(false);
  }, [presaleCode, token]);

  const handleRedeemCode = useCallback(async () => {
    if (!presaleCode || !canRedeem) return;

    if (codeType === 2 && !walletAddress) {
      setMessage('Please enter the wallet address for this code type.');
      setMessageType('error');
      return;
    }

    setIsRedeeming(true);
    setMessage(null);
    setMessageType(null);

    const response = await redeemPresaleCode(
      {
        code: presaleCode.toUpperCase(),
        walletAddress: codeType === 2 ? walletAddress : undefined,
      },
      token
    );

    if (response.success) {
      setMessage(response.message);
      await fetchAndUpdateUser();
      setMessageType('success');
      setCanRedeem(false); // Disable further attempts in the drawer
      setTimeout(() => {
        onClose();
        setPresaleCode('');
        setWalletAddress('');
        setCodeType(null);
        setIsWalletInputVisible(false);
        setCanRedeem(false);
        setMessage(null);
        setMessageType(null);
      }, 1500);
    } else {
      setMessage(response.message);
      setMessageType('error');
    }

    setIsRedeeming(false);
  }, [presaleCode, walletAddress, canRedeem, codeType, token, fetchAndUpdateUser, onClose]);

  return (
    <View style={styles.sheetContentContainer}>
      <Text preset='h4' style={styles.sheetTitle}>
        Redeem Presale Code
      </Text>
      <View style={styles.inputContainer}>
        <Input
          placeholder='Enter your presale code'
          value={presaleCode}
          onChangeText={setPresaleCode}
          autoCapitalize='characters'
          style={[genericStyles.input, styles.input]}
          leftIcon={<Ionicons name='ticket-outline' size={20} color={Colors.icon} />}
        />
      </View>
      {isWalletInputVisible && (
        <View style={styles.inputContainer}>
          <Text preset='label'>Redeem to wallet</Text>
          <Input
            placeholder='Redeem Wallet'
            value={walletAddress}
            onChangeText={setWalletAddress}
            style={[genericStyles.input, styles.input]}
            leftIcon={<Ionicons name='wallet-outline' size={20} color={Colors.icon} />}
            editable={!isRedeeming} // Disable if redeeming
          />
        </View>
      )}
      {message && (
        <Text style={[styles.messageText, messageType === 'success' ? styles.successText : styles.errorText]}>
          {message}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        {canRedeem ? (
          <Button
            title='Redeem Code'
            onPress={handleRedeemCode}
            fullWidth
            disabled={isRedeeming || isChecking}
            loading={isRedeeming}
          />
        ) : (
          <Button
            title='Check Code'
            onPress={handleCheckCode}
            fullWidth
            disabled={isChecking || isRedeeming}
            loading={isChecking}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContentContainer: {
    padding: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 15,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
    gap: 5,
  },
  input: {
    // specific styles for input in this drawer if any, otherwise genericStyles.input is used
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
  },
  successText: {
    color: Colors.success,
  },
  errorText: {
    color: Colors.error,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default RedeemPresaleDrawerContent;
