import React from 'react'
import { Platform, useWindowDimensions, View } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

import { CustomTabBar } from './CustomTabBar'
import { CustomSideBar } from './CustomSideBar'
import { useSidebarVisible, SIDEBAR_WIDTH } from '@/constants/Layout'

/**
 * Navigation component that renders either a sidebar or bottom tabs based on platform and screen width
 * This component is only used as the tabBar in the TabLayout
 * - Always use sidebar for web browsers regardless of size
 * - Use responsive layout (sidebar/tabbar) based on screen width for native mobile
 */
export function ResponsiveNavigation(props: BottomTabBarProps) {
  const { width } = useWindowDimensions()

  // Always use sidebar on web, regardless of window size
  const isWeb = Platform.OS === 'web'

  // On native platforms, use sidebar for large screens only
  const isLargeScreen = useSidebarVisible(width)

  // Use sidebar when on web OR when on a large screen on native
  const useSidebar = isLargeScreen

  if (useSidebar) {
    return <CustomSideBar {...props} />
  }

  return <CustomTabBar {...props} />
}
