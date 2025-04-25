import * as Clipboard from 'expo-clipboard'
import { useToastStore } from '@/store/toastStore'

/**
 * Hook for copying wallet addresses to clipboard with toast notification
 * @returns Function to copy a wallet address to clipboard
 */
export const useWalletClipboard = () => {
  const { showToast } = useToastStore()

  /**
   * Copies a wallet address to clipboard and shows a success toast
   * @param address The wallet address to copy
   * @param invalidValue Optional value to check against (e.g., 'No wallet linked')
   * @returns Promise that resolves when copying is complete
   */
  const copyAddressToClipboard = async (address: string | undefined, invalidValue: string = 'No wallet linked') => {
    if (!address || address === invalidValue) return
    
    try {
      await Clipboard.setStringAsync(address)
      showToast('Wallet address copied to clipboard!', 'success')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      showToast('Failed to copy address', 'error')
    }
  }

  return { copyAddressToClipboard }
}
