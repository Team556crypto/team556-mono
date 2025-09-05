import { createContext, ReactNode } from 'react'

// Define the shape of the context data
export interface DrawerContextType {
  openDrawer: (content: ReactNode, options?: { maxHeight?: number; minHeight?: number }) => void
  closeDrawer: () => void
  isDrawerVisible: boolean
}

// Create the context with default values
export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {
    console.warn('openDrawer function called before DrawerContext Provider was ready.')
  },
  closeDrawer: () => {
    console.warn('closeDrawer function called before DrawerContext Provider was ready.')
  },
  isDrawerVisible: false
})
