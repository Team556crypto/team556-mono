import { createContext, useContext } from 'react'
import { DefaultColors, ThemeColors } from '../constants/Colors'

// Create theme context with default values
export interface ThemeContextType {
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DefaultColors
})

// Global app theme that can be set from outside the UI package
let appTheme: ThemeColors | null = null

/**
 * Set the application theme that will be used by all UI components
 * This should be called at the app root level
 */
export function setAppTheme(colors: ThemeColors): void {
  appTheme = colors
}

/**
 * Hook for consuming the theme in UI components
 * If appTheme is set (via setAppTheme), it will be used
 * Otherwise, falls back to context or default colors
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)

  // If app theme is set globally, use that first
  if (appTheme) {
    return { colors: appTheme }
  }

  // Otherwise use context value
  return context
}
