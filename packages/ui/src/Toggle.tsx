import React, { useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor
} from 'react-native-reanimated'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import { useTheme } from './ThemeContext'

export type ToggleSize = 'small' | 'medium' | 'large'

export interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  labelPosition?: 'left' | 'right'
  size?: ToggleSize
  activeColor?: string
  inactiveColor?: string
  style?: ViewStyle
  thumbColor?: string
  colors?: Partial<ThemeColors>
}

export default function Toggle({
  value,
  onValueChange,
  disabled = false,
  label,
  labelPosition = 'right',
  size = 'medium',
  activeColor,
  inactiveColor,
  style,
  thumbColor = '#fff',
  colors: explicitColors
}: ToggleProps): JSX.Element {
  // Get colors from context if available
  const themeContext = useTheme()

  // Use explicitly provided colors if available, otherwise use context colors
  const colors = explicitColors ? { ...DefaultColors, ...explicitColors } : themeContext.colors

  // Use provided colors or fall back to theme colors
  const finalActiveColor = activeColor || colors.tint
  const finalInactiveColor = inactiveColor || 'rgba(255, 255, 255, 0.2)'

  // Set dimensions based on size
  const dimensions = {
    small: {
      width: 36,
      height: 20,
      thumbSize: 16,
      thumbOffset: 2
    },
    medium: {
      width: 46,
      height: 26,
      thumbSize: 20,
      thumbOffset: 3
    },
    large: {
      width: 56,
      height: 32,
      thumbSize: 24,
      thumbOffset: 4
    }
  }

  const { width, height, thumbSize, thumbOffset } = dimensions[size]
  const translateDistance = width - thumbSize - 2 * thumbOffset

  // Use reanimated's shared values for animations
  const progress = useSharedValue(value ? 1 : 0)

  // Update position when value changes
  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    })
  }, [value, progress])

  // Create animated styles using reanimated
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: progress.value * translateDistance
        }
      ],
      backgroundColor: thumbColor,
      opacity: disabled ? 0.6 : 1
    }
  })

  const trackStyle = useAnimatedStyle(() => {
    // Use interpolateColor for proper color animation
    const backgroundColor = interpolateColor(progress.value, [0, 1], [finalInactiveColor, finalActiveColor])

    return {
      backgroundColor,
      opacity: disabled ? 0.4 : 1
    }
  })

  // Handle toggle press
  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value)
    }
  }

  // Render toggle and optional label
  return (
    <View style={[styles.container, style]}>
      {label && labelPosition === 'left' && (
        <Text style={[styles.label, { color: colors.text }, disabled && styles.disabledLabel]}>{label}</Text>
      )}

      <TouchableOpacity activeOpacity={0.8} onPress={handleToggle} disabled={disabled} style={styles.toggleContainer}>
        <Animated.View
          style={[
            styles.track,
            {
              width,
              height,
              borderRadius: height / 2
            },
            trackStyle
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                top: (height - thumbSize) / 2,
                left: thumbOffset
              },
              thumbStyle
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {label && labelPosition === 'right' && (
        <Text style={[styles.label, { color: colors.text }, disabled && styles.disabledLabel]}>{label}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6
  },
  toggleContainer: {
    justifyContent: 'center'
  },
  track: {
    justifyContent: 'center',
    position: 'relative'
  },
  thumb: {
    position: 'absolute',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  disabledThumb: {
    backgroundColor: '#e0e0e0'
  },
  label: {
    marginHorizontal: 8,
    fontSize: 16
  },
  disabledLabel: {
    opacity: 0.5
  }
})
