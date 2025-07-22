import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { excludedRoutes } from '@/constants/Global'
import { useBreakpoint } from '@/hooks/useBreakpoint'

import { Colors } from '@/constants/Colors'

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { isTabletOrLarger } = useBreakpoint()

  const tabBarHeight = 60
  const bottomInset = Platform.OS === 'ios' ? (insets.bottom > 8 ? insets.bottom - 4 : insets.bottom) : insets.bottom

  // Add horizontal padding on web platform to prevent edge touch issues
  const horizontalPadding = Platform.OS === 'web' ? 30 : 0

  return (
    <View
      style={[
        styles.container,
        {
          height: tabBarHeight + bottomInset,
          paddingBottom: bottomInset,
          paddingHorizontal: horizontalPadding,
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

          // Determine if this is the rightmost visible tab
          const isRightmostTab = index === state.routes.filter(r => !excludedRoutes.includes(r.name)).length - 1

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole='button'
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, isRightmostTab && Platform.OS === 'web' && styles.rightmostTabButton]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {/* Icon with extra padding to ensure touch area */}
              <View style={[styles.iconContainer, Platform.OS === 'web' && styles.webIconContainer]}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? Colors.primary : Colors.tabIconDefault,
                    size: 28 // Slightly larger icons for better visibility
                  })}
              </View>

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
    width: '100%'
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 66,
    width: '100%'
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8
  },
  rightmostTabButton: {
    zIndex: 10 // Higher z-index for the rightmost tab on web
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  webIconContainer: {
    position: 'relative',
    zIndex: 20, // Ensure icon is above any potential overlays
    cursor: 'pointer' // Add pointer cursor for web
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
    fontWeight: '500'
  }
})
