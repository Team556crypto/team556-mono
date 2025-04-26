import { create } from 'zustand'
import { ReactNode } from 'react'

interface DrawerState {
  isVisible: boolean
  content: ReactNode | null
  maxHeight?: number
  minHeight?: number
  openDrawer: (content: ReactNode, options?: { maxHeight?: number; minHeight?: number }) => void
  closeDrawer: () => void
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isVisible: false,
  content: null,
  maxHeight: undefined,
  minHeight: undefined,

  openDrawer: (content, options) =>
    set({
      isVisible: true,
      content: content,
      maxHeight: options?.maxHeight,
      minHeight: options?.minHeight
    }),

  closeDrawer: () =>
    set({
      isVisible: false,
      // Optional: Clear content after a delay to allow animation
      // setTimeout(() => set({ content: null }), 300);
      content: null // Clear content immediately on close for simplicity
    })
}))
