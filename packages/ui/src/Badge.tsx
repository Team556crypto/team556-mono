import React from 'react'
import { Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle, View } from 'react-native'
import { useTheme } from './ThemeContext'
import Text from './Text'

export interface BadgeProps extends Omit<PressableProps, 'style'> {
  label: string
  isActive?: boolean
  style?: StyleProp<ViewStyle>
  icon?: React.ReactNode
}

export const Badge = ({ label, isActive, style, icon, ...rest }: BadgeProps) => {
  const { colors } = useTheme()

  const backgroundColor = isActive ? colors.primary : colors.backgroundCard
  const textColor = isActive ? colors.text : colors.text
  const textWeight = isActive ? 'bold' : '500'

  const borderColor = colors.backgroundSubtle

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor
        },
        style
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {icon ? icon : null}
        <Text style={[styles.text, { color: textColor, fontWeight: textWeight, marginLeft: icon ? 8 : 0 }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500'
  }
})
