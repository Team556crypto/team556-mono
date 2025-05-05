import React from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ScrollView
} from 'react-native'
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
    router.push('/signin' as any)
  }

  const handleSignUpPress = () => {
    router.push('/signup' as any)
  }

  return (
    <SafeAreaView style={styles.safeAreaMobile}>
      <View style={[styles.containerMobile, isTabletOrLarger && styles.containerMobileTablet]}>
        <View style={styles.logoContainerMobile}>
          <LogoSvg width={150} height={150} />
        </View>
        <View style={[styles.buttonContainerMobile, isTabletOrLarger && styles.buttonContainerMobileTablet]}>
          <Button
            title='Sign In'
            onPress={handleSignInPress}
            style={styles.signInButtonMobile}
            fullWidth
          />
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

  return (
    <View style={styles.webContainer}>
      <BackgroundEffects />
      <ScrollView style={styles.webScrollView} contentContainerStyle={styles.webScrollViewContent}>
        <LandingHeader router={router} colors={Colors} />
        <HeroSection colors={Colors} />
        <CtaSection router={router} colors={Colors} />
        <FeaturesSection colors={Colors} />
        <HowItWorksSection colors={Colors} />
        <FooterSection colors={Colors} />
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
    backgroundColor: Colors.background
  },
  webScrollView: {
    flex: 1
  },
  webScrollViewContent: {
  }
})
