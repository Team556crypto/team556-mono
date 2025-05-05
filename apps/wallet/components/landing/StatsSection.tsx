import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';

const StatsSection: React.FC = () => {
  // State for counter values
  const [counterValues, setCounterValues] = useState({
    users: 0,
    firearms: 0,
    transactions: 0
  });

  // Target values for the counters
  const targetValues = {
    users: 5000,
    firearms: 120000,
    transactions: 750000
  };

  // Animation state
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef(0);

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Animate counter values
  useEffect(() => {
    const animateCounters = () => {
      const animationDuration = 2000; // 2 seconds
      const steps = 50;
      const stepDuration = animationDuration / steps;

      const stepValueUsers = targetValues.users / steps;
      const stepValueFirearms = targetValues.firearms / steps;
      const stepValueTransactions = targetValues.transactions / steps;

      // Clear any existing animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      // Reset step
      stepRef.current = 0;

      // Start animation
      animationRef.current = setInterval(() => {
        stepRef.current++;

        setCounterValues({
          users: Math.min(Math.floor(stepValueUsers * stepRef.current), targetValues.users),
          firearms: Math.min(Math.floor(stepValueFirearms * stepRef.current), targetValues.firearms),
          transactions: Math.min(Math.floor(stepValueTransactions * stepRef.current), targetValues.transactions)
        });

        if (stepRef.current >= steps) {
          if (animationRef.current) {
            clearInterval(animationRef.current);
          }
        }
      }, stepDuration);
    };

    // Start animation when component mounts
    animateCounters();

    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Get custom gradient styles for each stat
  const getGradientTextStyle = (type: 'users' | 'firearms' | 'transactions') => {
    if (Platform.OS === 'web') {
      switch (type) {
        case 'users':
          return {
            background: 'linear-gradient(90deg, #9945FF, #b980ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          };
        case 'firearms':
          return {
            background: 'linear-gradient(90deg, #44b0ff, #4fceff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          };
        case 'transactions':
          return {
            background: 'linear-gradient(90deg, #14F195, #7affc6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          };
      }
    } else {
      // For native, we'll just use solid colors
      switch (type) {
        case 'users':
          return { color: Colors.primary || '#9945FF' };
        case 'firearms':
          return { color: '#44b0ff' }; // Using Solana blue
        case 'transactions':
          return { color: Colors.secondary || '#14F195' };
      }
    }
  };

  // Get indicator color for each stat
  const getIndicatorStyle = (type: 'users' | 'firearms' | 'transactions') => {
    switch (type) {
      case 'users':
        return styles.primaryIndicator;
      case 'firearms':
        return styles.blueIndicator;
      case 'transactions':
        return styles.secondaryIndicator;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.statsCardContainer}>
          <View style={styles.statsGrid}>
            {/* Users stat */}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, getGradientTextStyle('users')]}>
                {formatNumber(counterValues.users)}+
              </Text>
              <Text style={styles.statLabel}>Users Worldwide</Text>
              <View style={[styles.indicator, getIndicatorStyle('users')]} />
            </View>

            {/* Firearms stat */}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, getGradientTextStyle('firearms')]}>
                {formatNumber(counterValues.firearms)}+
              </Text>
              <Text style={styles.statLabel}>Firearms Tracked</Text>
              <View style={[styles.indicator, getIndicatorStyle('firearms')]} />
            </View>

            {/* Transactions stat */}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, getGradientTextStyle('transactions')]}>
                {formatNumber(counterValues.transactions)}+
              </Text>
              <Text style={styles.statLabel}>Secure Transactions</Text>
              <View style={[styles.indicator, getIndicatorStyle('transactions')]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  statsCardContainer: {
    backgroundColor: 'rgba(30, 30, 40, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
    } : {}),
  },
  statsGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: isTablet ? 42 : 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  indicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  primaryIndicator: {
    backgroundColor: Colors.primary || '#9945FF',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, #9945FF, #b980ff)',
    } : {}),
  },
  blueIndicator: {
    backgroundColor: '#44b0ff', // Solana blue
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, #44b0ff, #4fceff)',
    } : {}),
  },
  secondaryIndicator: {
    backgroundColor: Colors.secondary || '#14F195',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, #14F195, #7affc6)',
    } : {}),
  },
});

export default StatsSection;
