import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useWalletStore } from '@/store/walletStore';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/services/api/types';

interface TransactionRowProps {
  transaction: Transaction;
}

interface RecentTransactionsCardProps {
  onSeeAllPress: () => void;
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
        <Text style={styles.dateText}>{new Date(transaction.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>{getAmountDisplay(transaction)}</Text>
      </View>
    </View>
  );
};

const RecentTransactionsCard = ({ onSeeAllPress }: RecentTransactionsCardProps) => {
  const { transactions, transactionsLoading, transactionsError, fetchTransactions } = useWalletStore();

  useEffect(() => {
    fetchTransactions(3);
  }, [fetchTransactions]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      {transactionsLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : transactionsError ? (
        <Text style={styles.errorText}>{transactionsError}</Text>
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyText}>No recent transactions.</Text>
      ) : (
        <View>
          {transactions.slice(0, 3).map((transaction) => (
            <TransactionRow key={transaction.signature} transaction={transaction} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,

    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tint
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    opacity: 0.9
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8
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
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default RecentTransactionsCard;
