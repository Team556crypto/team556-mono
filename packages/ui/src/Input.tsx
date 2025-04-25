import React, { useState } from 'react'
import { TextInput, View, StyleSheet, Text as RNText, TextInputProps, Pressable, Platform } from 'react-native'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useTheme } from './ThemeContext'

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  onRightIconPress?: () => void
  clearable?: boolean
  onClear?: () => void
  isPassword?: boolean
  colors?: Partial<ThemeColors>
}

export default function Input({
  label,
  error,
  helperText,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
  clearable,
  onClear,
  isPassword,
  value,
  onChangeText,
  secureTextEntry,
  colors: explicitColors,
  ...props
}: InputProps): JSX.Element {
  // Get colors from context if available
  const themeContext = useTheme()

  // Use explicitly provided colors if available, otherwise use context colors
  const colors = explicitColors ? { ...DefaultColors, ...explicitColors } : themeContext.colors

  // Extract backgroundColor and other style props
  const { backgroundColor, ...otherStyleProps } = StyleSheet.flatten(style || {})

  // Password visibility state
  const [hidePassword, setHidePassword] = useState(isPassword)

  // Handle text clearing
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('')
    }
    if (onClear) {
      onClear()
    }
  }

  // Password visibility toggle
  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword)
  }

  // Determine which right element to show (clear button, password toggle, or custom right icon)
  const renderRightElement = () => {
    if (value && clearable) {
      return (
        <Pressable style={styles.rightIconContainer} onPress={handleClear}>
          <MaterialIcons name='close' size={20} color={colors.text} />
        </Pressable>
      )
    }

    if (isPassword) {
      return (
        <Pressable style={styles.rightIconContainer} onPress={togglePasswordVisibility}>
          <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color={colors.text} />
        </Pressable>
      )
    }

    if (rightIcon) {
      return (
        <Pressable style={styles.rightIconContainer} onPress={onRightIconPress}>
          {rightIcon}
        </Pressable>
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      {label ? <RNText style={[styles.label, { color: colors.text }]}>{label}</RNText> : null}
      <View
        style={[
          styles.inputContainer,
          error ? [styles.inputContainerError, { borderColor: colors.error }] : null,
          backgroundColor ? { backgroundColor } : null
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            otherStyleProps,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Platform.OS === 'web' ? ({ outlineWidth: 0 } as any) : {},
          ]}
          placeholderTextColor='#888'
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidePassword : secureTextEntry}
          {...props}
        />
        {renderRightElement()}
      </View>
      {helperText ? <RNText style={styles.helperText}>{helperText}</RNText> : null}
      {error ? <RNText style={[styles.error, { color: colors.error }]}>{error}</RNText> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '500'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0
  },
  inputContainerError: {
    borderWidth: 1
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16
  },
  leftIconContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rightIconContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4
  },
  error: {
    marginTop: 5,
    fontSize: 14
  }
})
