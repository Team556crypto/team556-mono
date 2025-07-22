import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from './ThemeContext';

interface CategorySummaryCardProps {
  icon: JSX.Element;
  title: string;
  count: number;
  totalValue?: number;
  onPress?: () => void;
}

export const CategorySummaryCard = ({ icon, title, count, totalValue, onPress }: CategorySummaryCardProps): JSX.Element => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 16,
    },
    iconContainer: {
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    countText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    valueText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
    valueLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.countText}>{`${count} ${count === 1 ? 'item' : 'items'}`}</Text>
      </View>
      {typeof totalValue === 'number' && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
          <Text style={styles.valueLabel}>Total Value</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
