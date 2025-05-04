import React from 'react'
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text } from '@team556/ui'
import LogoSvg from '@/assets/images/logo.svg'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function LandingScreen() {
  const router = useRouter()
  const { isTabletOrLarger } = useBreakpoint()

  const handleSignInPress = () => {
    router.push('/signin' as any) // Navigate to the sign-in screen
  }

  const handleSignUpPress = () => {
    router.push('/signup' as any) // Navigate to the sign-up screen
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isTabletOrLarger && styles.containerTablet]}>
        {/* Logo centered in the top portion */}
        <View style={styles.logoContainer}>
          <LogoSvg width={150} height={150} />
        </View>

        {/* Buttons at the bottom */}
        <View style={[styles.buttonContainer, isTabletOrLarger && styles.buttonContainerTablet]}>
          <Button
            title='Sign In'
            onPress={handleSignInPress}
            style={styles.signInButton}
            fullWidth
          />
          <TouchableOpacity onPress={handleSignUpPress} style={styles.signUpButton}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between', // Push logo up, buttons down
    paddingHorizontal: 24,
    paddingBottom: 40, // Padding for bottom buttons
    paddingTop: 60, // Padding for logo
    width: '100%'
  },
  containerTablet: {
    paddingHorizontal: '20%', // Center content more on tablet
    paddingBottom: 60,
    paddingTop: 80
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1 // Allows it to take available space pushing buttons down
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center'
  },
  buttonContainerTablet: {
    maxWidth: 380 // Limit button width on tablet
  },
  signInButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    marginBottom: 16
  },
  signUpButton: {
    paddingVertical: 12 // Make touchable area larger
  },
  signUpText: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16
  }
})
