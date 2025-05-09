import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from '@repo/ui';

interface ComingSoonDrawerContentProps {
  onClose: () => void;
}

const ComingSoonDrawerContent: React.FC<ComingSoonDrawerContentProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <Text preset='h4'>Feature Coming Soon!</Text>
      <Text preset='paragraph' style={styles.messageText}>
        The ability to change your password directly within the app is under development.
      </Text>
      <Button title='Close' onPress={onClose} variant='secondary' />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    gap: 15,
  },
  messageText: {
    textAlign: 'center',
  },
});

export default ComingSoonDrawerContent;
