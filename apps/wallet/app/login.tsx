import React from 'react'
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@team556/ui'
import LogoSvg from '@/assets/images/logo.svg'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'

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

  const handleSignInPress = () => {
    router.push('/signin')
  }

  const handleSignUpPress = () => {
    router.push('/signup')
  }

  return (
    <SafeAreaView style={styles.safeAreaMobile}>
      <View style={[styles.containerMobile, isTabletOrLarger && styles.containerMobileTablet]}>
        <View style={styles.logoContainerMobile}>
          <LogoSvg width={150} height={150} />
        </View>
        <View style={[styles.buttonContainerMobile, isTabletOrLarger && styles.buttonContainerMobileTablet]}>
          <Button title='Sign In' onPress={handleSignInPress} style={styles.signInButtonMobile} fullWidth />
          <TouchableOpacity onPress={handleSignUpPress} style={styles.signUpButtonMobile}>
            <Text style={styles.signUpTextMobile}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <FeaturesSection />
          </View>
        </View>

        <View style={sectionPadding}>
          <View style={contentWidth}>
            <HowItWorksSection />
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
  safeAreaMobile: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  containerMobile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 60,
    width: '100%'
  },
  containerMobileTablet: {
    paddingHorizontal: '20%',
    paddingBottom: 60,
    paddingTop: 80
  },
  logoContainerMobile: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1
  },
  buttonContainerMobile: {
    width: '100%',
    alignItems: 'center'
  },
  buttonContainerMobileTablet: {
    maxWidth: 380
  },
  signInButtonMobile: {
    width: '100%',
    backgroundColor: Colors.primary,
    marginBottom: 16
  },
  signUpButtonMobile: {
    paddingVertical: 12
  },
  signUpTextMobile: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16
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
