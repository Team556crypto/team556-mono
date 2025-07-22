import React, { useState } from 'react';
import { View, StyleSheet, Alert, TextInput } from 'react-native';
import { Button, Text, Input } from '@repo/ui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';

interface DeleteUserDrawerContentProps {
  onClose: () => void;
}

const DeleteUserDrawerContent: React.FC<DeleteUserDrawerContentProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deleteAccount } = useAuthStore();

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await deleteAccount(password);
      onClose();
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
    } catch (error: any) {
      Alert.alert('Delete Failed', error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <View style={styles.sheetContentContainer}>
      <Text preset='h4' style={styles.sheetTitle}>
        Delete Account
      </Text>
      <Text preset='label' style={styles.messageText}>
        This action cannot be undone. Please enter your password to confirm account deletion.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text preset='label' style={styles.inputLabel}>Password</Text>
        <Input
          placeholder='Enter your password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.passwordInput}
          autoCapitalize='none'
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Deleting...' : 'Delete Account'}
          onPress={handleDeleteAccount}
          variant='danger'
          fullWidth
          disabled={isLoading || !password}
          leftIcon={<Ionicons name='trash-outline' size={20} color='#fff' />}
        />
        <Button
          title='Cancel'
          onPress={onClose}
          variant='secondary'
          fullWidth
          style={styles.cancelButton}
        />
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
  buttonContainer: {
    marginTop: 10,
    gap: 10,
  },
  messageText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 15,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.backgroundLight,
  },
  cancelButton: {
    marginTop: 5,
  },
});

export default DeleteUserDrawerContent;
