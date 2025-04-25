import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

import { ResponsiveNavigation } from '@/components/ResponsiveNavigation'
import { Colors } from '@/constants/Colors'
import { Entypo, Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  const isWeb = Platform.OS === 'web'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false,
        tabBarStyle: {
          // Hide default tab bar on web
          display: isWeb ? 'none' : undefined
        }
      }}
      // Use our responsive navigation component that handles both sidebar and bottom tabs
      tabBar={props => <ResponsiveNavigation {...props} />}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <Entypo name='wallet' size={28} color={color} />
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name='settings' size={28} color={color} />
        }}
      />
    </Tabs>
  )
}
