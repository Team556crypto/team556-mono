import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { excludedRoutes } from '@/constants/Global'
import { useBreakpoint } from '@/hooks/useBreakpoint'

import { Colors } from '@/constants/Colors'
const { width } = Dimensions.get('window')

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { isTabletOrLarger } = useBreakpoint()

  const tabBarHeight = 60
  const bottomInset = Platform.OS === 'ios' ? (insets.bottom > 8 ? insets.bottom - 8 : insets.bottom) : insets.bottom

  return (
    <View
      style={[
        styles.container,
        {
          height: tabBarHeight + bottomInset,
          paddingBottom: bottomInset,
          backgroundColor: Colors.backgroundDarkest,
          borderTopWidth: 1,
          borderTopColor: Colors.background
        }
      ]}
    >
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label = options.title ?? route.name
          const isFocused = state.index === index

          if (excludedRoutes.includes(route.name)) {
            return null
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key
            })
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole='button'
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              {options.tabBarIcon &&
                options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? Colors.primary : Colors.tabIconDefault,
                  size: 24
                })}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isFocused ? Colors.primary : Colors.tabIconDefault,
                    opacity: isFocused ? 1 : 0.8
                  }
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 64,
    width: '100%'
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500'
  }
})
