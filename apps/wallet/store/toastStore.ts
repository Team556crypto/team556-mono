import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  isVisible: boolean
  message: string | null
  type: ToastType
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
}

let timeoutId: NodeJS.Timeout | null = null

export const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  message: null,
  type: 'info', // Default type

  showToast: (message, type = 'info', duration = 3000) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    set({ isVisible: true, message, type })

    // Set a new timeout to hide the toast
    timeoutId = setTimeout(() => {
      set({ isVisible: false })
      timeoutId = null
    }, duration)
  },

  hideToast: () => {
    // Clear timeout if manually hidden
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    set({ isVisible: false })
  }
}))
