import React, { ReactNode } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
  ImageStyle,
  Dimensions,
  TouchableOpacityProps
} from 'react-native'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import Text from './Text'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export type CardVariant = 'filled' | 'outlined' | 'elevated' | 'minimal'
export type CardLayout = 'vertical' | 'horizontal' | 'split'
export type CardSize = 'small' | 'medium' | 'large' | 'full'

export interface CardProps extends Omit<TouchableOpacityProps, 'style' | 'disabled'> {
  // Content
  title?: string
  subtitle?: string
  content?: string | ReactNode
  icon?: ReactNode
  media?: ReactNode
  footer?: ReactNode

  // Styling & Layout
  variant?: CardVariant
  layout?: CardLayout
  size?: CardSize
  rounded?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  titleStyle?: StyleProp<TextStyle>
  subtitleStyle?: StyleProp<TextStyle>
  mediaStyle?: StyleProp<ViewStyle>
  iconContainerStyle?: StyleProp<ViewStyle>
  footerStyle?: StyleProp<ViewStyle>
  colors?: Partial<ThemeColors>

  // Interaction
  onPress?: () => void
  disabled?: boolean
  selected?: boolean
}

export default function Card({
  // Content
  title,
  subtitle,
  content,
  icon,
  media,
  footer,

  // Styling & Layout
  variant = 'filled',
  layout = 'vertical',
  size = 'medium',
  rounded = true,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  mediaStyle,
  iconContainerStyle,
  footerStyle,
  colors = {},

  // Interaction
  onPress,
  disabled = false,
  selected = false,

  // Other props
  ...rest
}: CardProps): JSX.Element {
  // Merge provided colors with defaults
  const themeColors = { ...DefaultColors, ...colors }

  // Card container styles based on variant
  const cardStyles = {
    filled: {
      backgroundColor: themeColors.backgroundDark,
      borderWidth: 0
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    elevated: {
      backgroundColor: themeColors.backgroundDark,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5
    },
    minimal: {
      backgroundColor: 'transparent',
      borderWidth: 0
    }
  } as const

  // Size styles
  const sizeStyles = {
    small: {
      width: SCREEN_WIDTH * 0.4,
      minHeight: 100
    },
    medium: {
      width: SCREEN_WIDTH * 0.8,
      minHeight: 150
    },
    large: {
      width: SCREEN_WIDTH * 0.9,
      minHeight: 200
    },
    full: {
      width: '100%',
      minHeight: 120
    }
  } as const

  // Selected state styles
  const selectedStyles = selected
    ? {
        borderWidth: 2,
        borderColor: themeColors.tint
      }
    : {}

  // Render card content based on layout
  const renderContent = () => {
    switch (layout) {
      case 'horizontal':
        return (
          <View style={styles.horizontalLayout}>
            {(icon || media) && (
              <View
                style={[
                  styles.mediaContainer,
                  layout === 'horizontal' && styles.horizontalMediaContainer,
                  iconContainerStyle
                ]}
              >
                {media ? media : icon}
              </View>
            )}

            <View style={[styles.textContainer, contentStyle]}>
              {title && (
                <Text preset='h4' style={[styles.title, titleStyle]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text preset='label' style={[styles.subtitle, subtitleStyle]}>
                  {subtitle}
                </Text>
              )}
              {typeof content === 'string' ? (
                <Text preset='paragraph' style={styles.contentText}>
                  {content}
                </Text>
              ) : (
                content
              )}
            </View>
          </View>
        )

      case 'split':
        return (
          <View style={styles.splitLayout}>
            {media && <View style={[styles.mediaContainer, styles.splitMediaContainer, mediaStyle]}>{media}</View>}

            <View style={[styles.splitContentContainer, contentStyle]}>
              {icon && <View style={[styles.iconContainer, iconContainerStyle]}>{icon}</View>}

              <View style={styles.textContainer}>
                {title && (
                  <Text preset='h4' style={[styles.title, titleStyle]}>
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text preset='label' style={[styles.subtitle, subtitleStyle]}>
                    {subtitle}
                  </Text>
                )}
                {typeof content === 'string' ? (
                  <Text preset='paragraph' style={styles.contentText}>
                    {content}
                  </Text>
                ) : (
                  <>{content}</>
                )}
              </View>
            </View>
          </View>
        )

      case 'vertical':
      default:
        return (
          <View style={styles.verticalLayout}>
            {/* Top: Icon or Media */}
            {icon && !media && <View style={[styles.iconContainer, iconContainerStyle]}>{icon}</View>}

            {media && <View style={[styles.mediaContainer, styles.verticalMediaContainer, mediaStyle]}>{media}</View>}

            {/* Middle: Text content */}
            <View style={[styles.textContainer, contentStyle]}>
              {title && (
                <Text preset='h4' style={[styles.title, titleStyle]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text preset='label' style={[styles.subtitle, subtitleStyle]}>
                  {subtitle}
                </Text>
              )}
              {typeof content === 'string' ? (
                <Text preset='paragraph' style={styles.contentText}>
                  {content}
                </Text>
              ) : (
                <>{content}</>
              )}
            </View>
          </View>
        )
    }
  }

  // Conditionally render as TouchableOpacity or View
  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          cardStyles[variant],
          sizeStyles[size],
          rounded && styles.rounded,
          disabled && styles.disabled,
          selectedStyles,
          style
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        {...rest}
      >
        {renderContent()}

        {/* Footer */}
        {footer && <View style={[styles.footer, footerStyle]}>{footer}</View>}
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={[
        styles.card,
        cardStyles[variant],
        sizeStyles[size],
        rounded && styles.rounded,
        disabled && styles.disabled,
        selectedStyles,
        style
      ]}
      {...(rest as any)}
    >
      {renderContent()}

      {/* Footer */}
      {footer && <View style={[styles.footer, footerStyle]}>{footer}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginVertical: 8
  },
  rounded: {
    borderRadius: 12
  },
  disabled: {
    opacity: 0.6
  },
  verticalLayout: {
    flexDirection: 'column'
  },
  horizontalLayout: {
    flexDirection: 'row'
  },
  splitLayout: {
    flexDirection: 'column'
  },
  iconContainer: {
    padding: 16,
    alignItems: 'center'
  },
  mediaContainer: {
    overflow: 'hidden'
  },
  verticalMediaContainer: {
    width: '100%',
    height: 160
  },
  horizontalMediaContainer: {
    width: 120,
    height: '100%'
  },
  splitMediaContainer: {
    width: '100%',
    height: 140
  },
  textContainer: {
    padding: 16,
    flex: 1
  },
  splitContentContainer: {
    padding: 16
  },
  title: {
    marginBottom: 4
  },
  subtitle: {
    marginBottom: 8,
    opacity: 0.8
  },
  contentText: {
    fontSize: 14,
    opacity: 0.9
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12
  }
})
