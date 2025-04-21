import { Tabs } from 'expo-router'
import React from 'react'

import { IconSymbol } from '@team556/ui'
import { CustomTabBar } from '@/components/CustomTabBar'
import { Colors } from '@/constants/Colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />
        }}
      />
      <Tabs.Screen
        name='clean'
        options={{
          title: 'Clean',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='list.bullet.rectangle' color={color} />
        }}
      />
    </Tabs>
  )
}
