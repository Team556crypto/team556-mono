import { Tabs } from 'expo-router'
import React from 'react'

import { ResponsiveNavigation } from '@/components/ResponsiveNavigation'
import { Colors } from '@/constants/Colors'
import { Entypo, Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false
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
