import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import { useTheme } from './ThemeContext'

export type TextPreset = 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'label' | 'caption' | 'error' | 'success' | 'default'

export interface TextProps extends Omit<RNTextProps, 'children'> {
  preset?: TextPreset
  bold?: boolean
  semibold?: boolean
  color?: string
  center?: boolean
  children?: string | JSX.Element | (string | JSX.Element)[]
  colors?: Partial<ThemeColors>
}

export default function Text({
  preset = 'default',
  bold,
  semibold,
  style,
  color,
  center,
  children,
  colors: explicitColors,
  ...props
}: TextProps): JSX.Element {
  // Get colors from context if available
  const themeContext = useTheme()

  // Use explicitly provided colors if available, otherwise use context colors
  const colors = explicitColors ? { ...DefaultColors, ...explicitColors } : themeContext.colors

  // Get the preset style with the appropriate color
  const presetStyle = getPresetStyle(preset, colors)

  return (
    <RNText
      style={[
        presetStyle,
        bold && styles.bold,
        semibold && styles.semibold,
        center && styles.center,
        color && { color },
        style
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

// Generate preset styles with theme colors
function getPresetStyle(preset: TextPreset, colors: ThemeColors) {
  const baseStyles = {
    h1: {
      fontSize: 32,
      color: colors.text,
      fontWeight: '700'
    },
    h2: {
      fontSize: 28,
      color: colors.text,
      fontWeight: '600'
    },
    h3: {
      fontSize: 24,
      color: colors.text,
      fontWeight: '600'
    },
    h4: {
      fontSize: 20,
      color: colors.text,
      fontWeight: '600'
    },
    paragraph: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24
    },
    label: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500'
    },
    caption: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)'
    },
    error: {
      fontSize: 14,
      color: colors.error
    },
    success: {
      fontSize: 14,
      color: colors.success
    },
    default: {
      fontSize: 16,
      color: colors.text
    }
  }

  return baseStyles[preset]
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700'
  },
  semibold: {
    fontWeight: '600'
  },
  center: {
    textAlign: 'center'
  }
})
