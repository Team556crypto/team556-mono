import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoWideSvg from '@/assets/images/logo-wide.svg'
import { excludedRoutes } from '@/constants/Global'
import { Colors } from '@/constants/Colors'
import { SIDEBAR_WIDTH } from '@/constants/Layout'

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
          backgroundColor: Colors.backgroundDarkest,
          borderRightWidth: 1,
          borderRightColor: Colors.background
          // borderWidth: 1,
          // borderColor: Colors.backgroundDarker
        }
      ]}
    >
      <View style={styles.header}>
        <LogoWideSvg width={140} height={36} style={styles.logo} />
      </View>
      <View style={styles.navContainer}>
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
              style={[styles.navButton, isFocused && styles.navButtonActive]}
            >
              <View style={styles.navIconContainer}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? Colors.primary : Colors.tabIconDefault,
                    size: 16
                  })}
              </View>
              <Text
                style={[
                  styles.navText,
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
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH
    // borderRadius: 10
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginTop: 6
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
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  navButtonActive: {
    // backgroundColor: Colors.background,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary
    // borderRightWidth: 2,
    // borderRightColor: Colors.backgroundDark,
    // borderTopRightRadius: 10,
    // borderBottomRightRadius: 10
  },
  navIconContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 8
  },
  navText: {
    fontSize: 15,
    fontWeight: '500'
  }
})
