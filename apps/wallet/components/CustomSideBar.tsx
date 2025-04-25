import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoWideSvg from '@/assets/images/logo-wide.svg'

import { Colors } from '@/constants/Colors'

export function CustomSideBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: Platform.OS === 'web' ? 0 : insets.left,
          backgroundColor: Colors.backgroundDark
        }
      ]}
    >
      <View style={styles.header}>
        <LogoWideSvg width={160} height={50} style={styles.logo} />
      </View>
      <View style={styles.navContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label = options.title ?? route.name
          const isFocused = state.index === index

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
              style={[styles.navButton, isFocused && styles.navButtonActive]}
            >
              <View style={styles.navIconContainer}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? Colors.tint : Colors.tabIconDefault,
                    size: 16
                  })}
              </View>
              <Text
                style={[
                  styles.navText,
                  {
                    color: isFocused ? Colors.tint : Colors.tabIconDefault,
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
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  logo: {},
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.tint
  },
  navContainer: {
    flex: 1
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.tint
  },
  navIconContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 14
  },
  navText: {
    fontSize: 15,
    fontWeight: '500'
  }
})
