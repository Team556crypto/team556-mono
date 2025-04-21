export type ThemeColors = {
  error: string
  success: string
  text: string
  background: string
  backgroundDark: string
  tint: string
  icon: string
  tabIconDefault: string
  tabIconSelected: string
}

export const DefaultColors: ThemeColors = {
  error: '#ff5252',
  success: '#4caf50',
  text: '#ECEDEE',
  background: '#2B2B32',
  backgroundDark: '#202026',
  tint: '#7A8EE7',
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#fff'
}

// For backward compatibility
export const Colors = DefaultColors
