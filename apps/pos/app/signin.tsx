import React, { useState } from 'react'
import { View, StyleSheet, SafeAreaView, Platform, TouchableOpacity, ScrollView, Switch } from 'react-native'
import { Input, Text } from '@team556/ui'
import { useRouter, Link } from 'expo-router'
import Head from 'expo-router/head'
import { genericStyles } from '@/constants/GenericStyles'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SignInScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const router = useRouter()
  const { isTabletOrLarger } = useBreakpoint()
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthStore()

  const handleSignIn = async () => {
    setAuthError(null)
    if (!email || !password) {
      setAuthError('Please enter both email and password.')
      return
    }
    try {
      await login({ email, password })
      
      // Save or clear remember me preference
      if (rememberMe) {
        if (Platform.OS === 'web') {
          localStorage.setItem('rememberedEmail', email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          await AsyncStorage.setItem('rememberedEmail', email)
          await AsyncStorage.setItem('rememberMe', 'true')
        }
      } else {
        if (Platform.OS === 'web') {
          localStorage.removeItem('rememberedEmail')
          localStorage.removeItem('rememberMe')
        } else {
          await AsyncStorage.removeItem('rememberedEmail')
          await AsyncStorage.removeItem('rememberMe')
        }
      }
    } catch (err) {
      console.error('Sign in failed:', err)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>Sign In - Team556 POS</title>
      </Head>
      
      {/* Back to Landing Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name='arrow-back' size={20} color={Colors.textSecondary} />
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <MaterialIcons 
              name='point-of-sale' 
              size={64} 
              color={Colors.primary} 
              style={styles.headerIcon} 
            />
            <Text style={styles.title}>Team556 POS</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            {authError && (
              <View style={styles.errorContainer}>
                <Ionicons name='alert-circle' size={20} color={Colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Username</Text>
              <Input
                placeholder='Enter your email or username'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize='none'
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
                leftIcon={<Ionicons name='person-outline' size={20} color={Colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Input
                placeholder='Enter your password'
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
                leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons 
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={Colors.icon} 
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.rememberContainer}>
                <Switch
                  trackColor={{ false: Colors.backgroundLight, true: Colors.primary }}
                  thumbColor={rememberMe ? Colors.text : Colors.textSecondary}
                  ios_backgroundColor={Colors.backgroundLight}
                  onValueChange={setRememberMe}
                  value={rememberMe}
                  style={styles.switch}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/auth/ForgotPasswordScreen' as any)}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleSignIn} 
              disabled={isLoading} 
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <Ionicons name='hourglass-outline' size={20} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.signInButtonText}>Signing In...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name='log-in-outline' size={20} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/signup')}
              style={styles.createAccountButton}
            >
              <Ionicons name='person-add-outline' size={20} color={Colors.primary} style={styles.buttonIcon} />
              <Text style={styles.createAccountText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionCard}>
                <Ionicons name='help-circle-outline' size={24} color={Colors.secondary} />
                <Text style={styles.quickActionText}>Help & Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <Ionicons name='settings-outline' size={24} color={Colors.secondary} />
                <Text style={styles.quickActionText}>System Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Team556 POS • Secure • Compliant • Modern
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500'
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  container: {
    flex: 1,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20
  },
  headerIcon: {
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  formCard: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12
  },
  errorIcon: {
    flexShrink: 0
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    flex: 1
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 12,
    color: Colors.text,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 16
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  switch: {
    transform: Platform.OS === 'ios' ? [] : [{ scaleX: 0.9 }, { scaleY: 0.9 }]
  },
  rememberText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500'
  },
  forgotButton: {
    padding: 4
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary + '40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4
  },
  signInButtonDisabled: {
    opacity: 0.7
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  buttonIcon: {
    flexShrink: 0
  },
  signInButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.backgroundLight
  },
  dividerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500'
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    gap: 8
  },
  createAccountText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  quickActions: {
    marginBottom: 24
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  quickActionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center'
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8
  }
})

export default SignInScreen
