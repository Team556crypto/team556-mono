import { Tabs } from 'expo-router'
import React from 'react'

import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { Colors } from '@/constants/Colors'
import { Entypo, Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'

export default function TabLayout() {
  // First get the user and loading state
  const user = useAuthStore(state => state.user);
  const isLoadingAuth = useAuthStore(state => state.isLoading);
  
  // Calculate isP1User directly to ensure real-time accuracy
  const isP1User = !!user && user.presale_type === 1;

  // Get authentication status
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // Debug logging
  console.log('[TabLayout] Auth State:', {
    isAuthenticated,
    isLoadingAuth,
    userPresaleType: user?.presale_type,
    isP1User,
    hasUser: !!user
  });

  if (isLoadingAuth) {
    console.log('[TabLayout] Still loading auth state, not rendering tabs yet');
    // Wait for the auth state to be determined
    return null; 
  }

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
  )
}
