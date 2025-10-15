import { Tabs } from 'expo-router'
import React from 'react'
import { View, useWindowDimensions, Platform } from 'react-native'

import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { Colors } from '@/constants/Colors'
import { Entypo, Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'

export default function TabLayout() {
  const isLoadingAuth = useAuthStore(state => state.isLoading);
  
  if (isLoadingAuth) {
    return null; 
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
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
          name='pay'
          options={{
            title: 'Pay',
            tabBarIcon: ({ color }) => <Ionicons name='card' size={28} color={color} />
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
    </View>
  )
}
