import React from 'react'
import { SafeAreaView, StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Toggle, Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'

type SettingItemProps = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  onPress?: () => void
  rightElement?: React.ReactNode
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, rightElement }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={22} color={Colors.tint} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text preset="paragraph" style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text preset="caption" style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingRightElement}>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={18} color="#ccc" />)}
    </View>
  </TouchableOpacity>
)

type SettingSectionProps = {
  title: string
  children: React.ReactNode
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
  <View style={styles.settingSection}>
    <Text preset="label" style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
)

export default function SettingsScreen() {
  const router = useRouter()
  const { logout: clearAuthStore } = useAuthStore()
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false)

  const handleLogout = async () => {
    try {
      await logoutUser()
      console.log('Server logout request sent.')
    } catch (error) {
      console.error('Failed to logout on server:', error)
      // Optional: Show a non-blocking message to the user
      // Alert.alert("Logout Notice", "Could not reach server, logging out locally.");
    } finally {
      // Always perform client-side logout actions
      clearAuthStore()
      router.replace('/login')
    }
  }

  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: handleLogout, style: "destructive" }
      ]
    )
  }

  // Navigation handler with type safety
  const navigateTo = (screen: string) => {
    router.push(screen as any) // Type assertion to handle router paths
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Text preset="h2" style={styles.headerTitle}>Settings</Text>
        </View>

        <SettingSection title="Account">
          <SettingItem 
            icon="person-outline" 
            title="Profile" 
            subtitle="Edit your personal information"
            onPress={() => navigateTo('/profile')}
          />
          <SettingItem 
            icon="key-outline" 
            title="Security" 
            subtitle="Password and authentication"
            onPress={() => navigateTo('/security')}
          />
        </SettingSection>

        <SettingSection title="Preferences">
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            rightElement={
              <Toggle 
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          <SettingItem 
            icon="finger-print-outline" 
            title="Biometric Authentication" 
            rightElement={
              <Toggle 
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
              />
            }
          />
          <SettingItem 
            icon="globe-outline" 
            title="Language" 
            subtitle="English"
            onPress={() => navigateTo('/language')}
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingItem 
            icon="help-circle-outline" 
            title="Help Center" 
            onPress={() => navigateTo('/help')}
          />
          <SettingItem 
            icon="document-text-outline" 
            title="Terms & Privacy Policy" 
            onPress={() => navigateTo('/terms')}
          />
          <SettingItem 
            icon="information-circle-outline" 
            title="About" 
            subtitle="Version 1.0.0"
            onPress={() => navigateTo('/about')}
          />
        </SettingSection>

        <View style={styles.logoutContainer}>
          <Button title="Logout" onPress={confirmLogout} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 50, // Add padding to ensure content at the bottom is visible
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  settingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.tint,
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  settingRightElement: {
    marginLeft: 8,
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 32,
  },
})
