import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, TouchableOpacityProps } from 'react-native'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import { useTheme } from './ThemeContext'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  colors?: Partial<ThemeColors>
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  colors: explicitColors,
  ...props
}: ButtonProps): JSX.Element {
  // Get colors from context if available
  const themeContext = useTheme()

  // Use explicitly provided colors if available, otherwise use context colors
  const colors = explicitColors ? { ...DefaultColors, ...explicitColors } : themeContext.colors

  const isDisabled = disabled || loading

  // Dynamic styles based on theme colors
  const buttonStyles = {
    primary: {
      backgroundColor: colors.tint,
      borderWidth: 0
    },
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 0
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.tint
    },
    danger: {
      backgroundColor: colors.error,
      borderWidth: 0
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0
    }
  }

  const textStyles = {
    primary: { color: '#fff' },
    secondary: { color: colors.text },
    outline: { color: colors.text },
    danger: { color: '#fff' },
    ghost: { color: colors.text }
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles[variant],
        styles[size],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style
      ]}
      disabled={isDisabled}
      {...props}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size='small' color={variant === 'outline' || variant === 'ghost' ? colors.text : '#fff'} />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
            <Text style={[styles.text, textStyles[variant], styles[`${size}Text`], isDisabled && styles.disabledText]}>
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  smallText: {
    fontSize: 14,
    fontWeight: '500'
  },
  medium: {
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  mediumText: {
    fontSize: 16,
    fontWeight: '500'
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 24
  },
  largeText: {
    fontSize: 18,
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.5
  },
  disabledText: {
    opacity: 0.8
  },
  fullWidth: {
    width: '100%'
  },
  text: {
    textAlign: 'center'
  },
  leftIconContainer: {
    marginRight: 8
  },
  rightIconContainer: {
    marginLeft: 8
  }
})
