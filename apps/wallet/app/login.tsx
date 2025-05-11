import React, { useState, useEffect } from 'react'
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text, Input } from '@team556/ui'
import LogoSvg from '@/assets/images/logo.svg'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useAuthStore } from '@/store/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  LandingHeader,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CtaSection,
  FooterSection,
  BackgroundEffects,
  ScrollToTop
} from '@/components/landing'

const MobileLandingScreen = () => {
  const router = useRouter()
  const { isTabletOrLarger } = useBreakpoint()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthStore()

  // Load remembered credentials on component mount
  useEffect(() => {
    const loadRecalledUser = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('rememberedEmail')
        const storedRememberMe = await AsyncStorage.getItem('rememberMe')
        
        if (storedRememberMe === 'true' && storedEmail) {
          setEmail(storedEmail)
          setRememberMe(true)
        }
      } catch (e) {
        console.error('Failed to load remember me preference', e)
      }
    }
    
    loadRecalledUser()
  }, [])

  const handleSignInPress = async () => {
    setAuthError(null)
    try {
      await login({ email, password })
      // Navigation handled by root layout

      // Save or clear remember me preference
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email)
        await AsyncStorage.setItem('rememberMe', 'true')
      } else {
        await AsyncStorage.removeItem('rememberedEmail')
        await AsyncStorage.removeItem('rememberMe')
      }
    } catch (err) {
      console.error('Sign in failed:', err)
    }
  }

  const handleSignUpPress = () => {
    router.push('/signup')
  }

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe)
  }

  return (
    <SafeAreaView style={styles.safeAreaMobile}>
      <BackgroundEffects />
      <ScrollView contentContainerStyle={[styles.containerMobile, isTabletOrLarger && styles.containerMobileTablet]}>
        <View style={styles.logoContainerMobile}>
          <LogoSvg width={isTabletOrLarger ? 180 : 140} height={isTabletOrLarger ? 180 : 140} />
          <Text style={styles.welcomeText}>Welcome to Team556</Text>
          <Text style={styles.subtitleText}>Sign in to access your Digital Armory</Text>
        </View>
        
        <View style={[styles.formContainer, isTabletOrLarger && styles.formContainerTablet]}>
          <Input
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            clearable
            leftIcon={<MaterialIcons name="email" size={20} color={Colors.textSecondary} />}
          />
          
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            isPassword
            leftIcon={<MaterialIcons name="lock" size={20} color={Colors.textSecondary} />}
          />
          
          <View style={styles.rememberForgotContainer}>
            <TouchableOpacity style={styles.rememberMeContainer} onPress={toggleRememberMe}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <MaterialIcons name="check" size={16} color={Colors.backgroundDarkest} />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          
          <Button 
            title={isLoading ? 'Signing In...' : 'Sign In'} 
            onPress={handleSignInPress} 
            style={styles.signInButtonMobile} 
            size="large"
            fullWidth 
            disabled={isLoading || !email || !password}
            loading={isLoading}
          />
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>
          
          <Button 
            title='Create Account' 
            onPress={handleSignUpPress} 
            variant="outline"
            style={styles.signUpButtonMobile} 
            size="large"
            fullWidth 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const WebLandingPage = () => {
  const router = useRouter()
  const { isTabletOrLarger, width } = useBreakpoint()

  // Responsive layout values
  const sectionPadding = isTabletOrLarger ? styles.webSectionPaddingLarge : styles.webSectionPaddingSmall
  const contentWidth = isTabletOrLarger ? styles.webContentWidthLarge : styles.webContentWidthSmall

  const handleGetStarted = () => router.push('/onboarding')
  const handleLogin = () => router.replace('/signin')

  return (
    <View style={styles.webContainer}>
      <BackgroundEffects />
      {/* Header is now outside the ScrollView */}
      {/* <View style={styles.headerWrapper}>
        <LandingHeader />
      </View> */}
      <ScrollView style={styles.webScrollView} contentContainerStyle={styles.webScrollViewContent}>
        {/* Content starts here, HeroSection has its own paddingTop to account for the header */}
        <View style={sectionPadding}>
          <View style={contentWidth}>
            <HeroSection onCreateWallet={handleGetStarted} onLogin={handleLogin} />
          </View>
        </View>

        <View style={sectionPadding}>
          <View style={contentWidth}>
            <CtaSection onCreateWallet={handleGetStarted} onLogin={handleLogin} />
          </View>
        </View>

        <View style={sectionPadding}>
          <View style={contentWidth}>
            <HowItWorksSection />
          </View>
        </View>

        <View style={sectionPadding}>
          <View style={contentWidth}>
            <FeaturesSection />
          </View>
        </View>

        <View style={sectionPadding}>
          <View style={contentWidth}>
            <FooterSection />
          </View>
        </View>
      </ScrollView>
      <ScrollToTop />
    </View>
  )
}

export default function LoginOrLandingScreen() {
  if (Platform.OS === 'web') {
    return <WebLandingPage />
  } else {
    return <MobileLandingScreen />
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%'
  },
  errorText: {
    color: Colors.errorText,
    textAlign: 'center',
    fontSize: 13
  },
  safeAreaMobile: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  containerMobile: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 60,
    width: '100%'
  },
  containerMobileTablet: {
    paddingHorizontal: '15%',
    paddingBottom: 60,
    paddingTop: 80
  },
  logoContainerMobile: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center'
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
  formContainer: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border
  },
  formContainerTablet: {
    maxWidth: 450
  },
  input: {
    backgroundColor: Colors.backgroundDark,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: Colors.primary
  },
  rememberMeText: {
    color: Colors.textSecondary,
    fontSize: 14
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  signInButtonMobile: {
    width: '100%',
    backgroundColor: Colors.primary,
    marginBottom: 24
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border
  },
  dividerText: {
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    fontSize: 14
  },
  signUpButtonMobile: {
    width: '100%',
    borderColor: Colors.primary
  },
  webContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  webScrollView: {
    flex: 1
  },
  webScrollViewContent: {},
  // Responsive layout styles
  webSectionPaddingSmall: {
    paddingHorizontal: 16
  },
  webSectionPaddingLarge: {
    paddingHorizontal: 48
  },
  webContentWidthSmall: {
    width: '100%'
  },
  webContentWidthLarge: {
    width: '100%',
    maxWidth: 1280,
    marginHorizontal: 'auto'
  },
  headerWrapper: {
    width: '100%',
    maxWidth: 1280,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  }
})
