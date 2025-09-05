import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'authToken'
const MNEMONIC_KEY = 'wallet_mnemonic' // Key for secure storage

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    }
  } catch (error) {
    console.error('Error saving auth token:', error)
    // Handle saving error appropriately
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY)
    } else {
      return await AsyncStorage.getItem(TOKEN_KEY)
    }
  } catch (error) {
    console.error('Error getting auth token:', error)
    // Handle retrieval error appropriately
    return null
  }
}

export async function deleteToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY)
    }
  } catch (error) {
    console.error('Error deleting auth token:', error)
    // Handle deletion error appropriately
  }
}

// --- Secure Mnemonic Storage ---

export const SecureStoreUtils = {
  async saveMnemonic(mnemonic: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // WARNING: localStorage is not secure for sensitive data like mnemonics on web.
        // This is for development/testing convenience only.
        console.warn('Storing mnemonic in localStorage on web. This is insecure!')
        localStorage.setItem(MNEMONIC_KEY, mnemonic)
      } else {
        await SecureStore.setItemAsync(MNEMONIC_KEY, mnemonic, {
          // Recommended: Require user authentication (biometrics/passcode) for accessing the key
          // keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY, // Example setting
          // requireAuthentication: true, // This might prompt user on access
        })
      }
    } catch (error) {
      console.error('Error saving mnemonic securely:', error)
      // Rethrow or handle error appropriately
      throw error
    }
  },

  async getMnemonic(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // WARNING: Retrieving mnemonic from insecure localStorage on web.
        console.warn('Retrieving mnemonic from insecure localStorage on web.')
        return localStorage.getItem(MNEMONIC_KEY)
      } else {
        // If requireAuthentication was used during save, this might prompt the user.
        const mnemonic = await SecureStore.getItemAsync(MNEMONIC_KEY)
        return mnemonic
      }
    } catch (error) {
      console.error('Error getting mnemonic securely:', error)
      // Handle retrieval error appropriately
      return null
    }
  },

  async deleteMnemonic(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // WARNING: Removing mnemonic from insecure localStorage on web.
        console.warn('Removing mnemonic from insecure localStorage on web.')
        localStorage.removeItem(MNEMONIC_KEY)
      } else {
        await SecureStore.deleteItemAsync(MNEMONIC_KEY)
      }
    } catch (error) {
      console.error('Error deleting mnemonic securely:', error)
      // Handle deletion error appropriately
      throw error
    }
  }
}
