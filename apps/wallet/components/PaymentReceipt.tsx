import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { formatWalletAddress } from '@/utils/formatWalletAddress';

interface PaymentReceiptProps {
  amount: string;
  recipient: string;
  recipientLabel?: string;
  message?: string;
  signature: string;
  timestamp: Date;
  onClose: () => void;
}

export function PaymentReceipt({ 
  amount, 
  recipient, 
  recipientLabel, 
  message, 
  signature, 
  timestamp,
  onClose 
}: PaymentReceiptProps) {
  const router = useRouter();

  const handleViewOnExplorer = () => {
    const explorerUrl = `https://explorer.solana.com/tx/${signature}`;
    Linking.openURL(explorerUrl);
  };

  const handleDonePress = () => {
    onClose();
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
        </View>
        <Text style={styles.headerText}>Payment Successful</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>{amount} TEAM</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recipient</Text>
          <View style={styles.recipientContainer}>
            {recipientLabel && (
              <Text style={styles.recipientLabel}>{recipientLabel}</Text>
            )}
            <Text style={styles.detailValue}>{formatWalletAddress(recipient)}</Text>
          </View>
        </View>

        {message && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Message</Text>
              <Text style={styles.detailValue}>{message}</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {timestamp.toLocaleString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.transactionContainer}>
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.transactionId}>{formatWalletAddress(signature)}</Text>
          <TouchableOpacity onPress={handleViewOnExplorer} style={styles.viewLink}>
            <Text style={styles.viewLinkText}>View on Explorer</Text>
            <Ionicons name="open-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleDonePress}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50, // Increased top padding
    backgroundColor: Colors.background,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  detailsContainer: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  recipientContainer: {
    alignItems: 'flex-end',
  },
  recipientLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.backgroundLight,
  },
  transactionContainer: {
    marginVertical: 12,
  },
  transactionId: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewLinkText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
