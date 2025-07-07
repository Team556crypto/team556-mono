import React from 'react';
import { View, StyleSheet } from 'react-native';

import Text from './Text';
import Button from './button';
import { useTheme } from './ThemeContext';

interface EmptyStateProps {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  buttonText: string;
  onPress: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  buttonText,
  onPress,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {icon}
      <Text preset="h3" style={styles.title}>
        {title}
      </Text>
      <Text preset="paragraph" center style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
      <Button title={buttonText} onPress={onPress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});
