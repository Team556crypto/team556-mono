import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useWalletStore } from '@/store/walletStore';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/services/api/types';

interface TransactionRowProps {
  transaction: Transaction;
}

interface TransactionHistoryDrawerProps {
  onClose: () => void;
}

const getTransactionVisuals = (
  type: Transaction['type']
): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  // Normalize the type to handle case variations
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === 'send') {
    return { icon: 'arrow-up-circle', color: Colors.error };
  } else if (normalizedType === 'receive') {
    return { icon: 'arrow-down-circle', color: Colors.success };
  } else if (normalizedType === 'swap') {
    return { icon: 'swap-horizontal', color: Colors.primary };
  } else if (normalizedType === 'team556 pay' || normalizedType === 'team556pay') {
    return { icon: 'card-outline', color: Colors.tint };
  } else if (normalizedType === 'contract interaction') {
    return { icon: 'document-text-outline', color: Colors.textSecondary };
  } else {
    return { icon: 'help-circle-outline', color: Colors.textSecondary };
  }
};

const getAmountDisplay = (transaction: Transaction) => {
  // Swap has a special string format like "X to Y"
  if (transaction.type === 'Swap') {
    return transaction.amount;
  }

  // The backend sends a string that can be negative.
  const amountValue = parseFloat(transaction.amount);

  if (isNaN(amountValue)) {
    return `${transaction.amount} ${transaction.token}`;
  }

  const sign = amountValue > 0 ? '+' : '';
  
  // transaction.amount already contains the number (and minus sign if negative)
  return `${sign}${transaction.amount} ${transaction.token}`;
};

const TransactionRow = ({ transaction }: TransactionRowProps) => {
  const { icon, color } = getTransactionVisuals(transaction.type);
  // Normalize the transaction type for display
  const isTeam556Pay = transaction.type.toLowerCase() === 'team556 pay' || transaction.type.toLowerCase() === 'team556pay';
  
  // Format the display type properly
  const displayType = isTeam556Pay ? 'Team556 Pay' : transaction.type;
  
  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.typeText}>{displayType}</Text>
        {isTeam556Pay && transaction.businessName && (
          <Text style={styles.businessText} numberOfLines={1} ellipsizeMode="tail">
            {transaction.businessName}
          </Text>
        )}
        {transaction.memo && <Text style={styles.memoText} numberOfLines={1} ellipsizeMode="tail">{transaction.memo}</Text>}
        <Text style={styles.dateText}>{new Date(transaction.date).toLocaleString()}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>{getAmountDisplay(transaction)}</Text>
      </View>
    </View>
  );
};

const TransactionHistoryDrawer = ({ onClose }: TransactionHistoryDrawerProps) => {
  const { transactions, transactionsLoading, transactionsError, fetchTransactions } = useWalletStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Transactions</Text>
      {transactionsLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : transactionsError ? (
        <Text style={styles.errorText}>{transactionsError}</Text>
      ) : (
        <View style={styles.transactionsList}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found.</Text>
          ) : (
            transactions.map((transaction) => (
              <TransactionRow key={transaction.signature} transaction={transaction} />
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  transactionsList: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  memoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  businessText: {
    fontSize: 13,
    color: Colors.tint,
    fontWeight: '500',
    marginTop: 2,
  },
  amountContainer: {},
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TransactionHistoryDrawer;
