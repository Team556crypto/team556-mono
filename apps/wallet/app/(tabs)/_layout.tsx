import { Tabs } from 'expo-router'
import React from 'react'

import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { Colors } from '@/constants/Colors'
import { Entypo, Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <ResponsiveNavigation {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <Entypo name='wallet' size={28} color={color} />
        }}
      />
      <Tabs.Screen
        name='digital-armory'
        options={{
          title: 'Armory',
          tabBarIcon: ({ color }) => <Ionicons name='shield-checkmark' size={28} color={color} />
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
