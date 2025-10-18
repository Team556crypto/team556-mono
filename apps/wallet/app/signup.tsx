import React, { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, Alert, SafeAreaView, Platform, TouchableOpacity, ScrollView, Animated } from 'react-native'
import { Input, Text } from '@team556/ui'
import { useRouter, Link, useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { genericStyles } from '@/constants/GenericStyles'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import LogoSvg from '@/assets/images/logo-wide.svg'

const SignUpScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const { isTabletOrLarger } = useBreakpoint()
  const { signup, isLoading, error: authError, setError: setAuthError } = useAuthStore()
  const router = useRouter()
  const params = useLocalSearchParams()

  // Animation references for left side
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateAnim = useRef(new Animated.Value(20)).current

  // Trigger animations on component mount and handle referral code from URL
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true
      })
    ]).start()
    
    // Set referral code from URL parameter if present
    if (params.ref && typeof params.ref === 'string') {
      setReferralCode(params.ref.toUpperCase())
    }
  }, [params.ref])

  const handleSignUp = async () => {
    setAuthError(null)
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }
    try {
      const signupData: { email: string; password: string; referral_code?: string } = { 
        email, 
        password 
      }
      
      // Add referral code if provided
      if (referralCode.trim()) {
        signupData.referral_code = referralCode.trim().toUpperCase()
      }
      
      await signup(signupData)
      // Navigation is handled by the root _layout based on auth state
    } catch (err) {
      // Error is set in the store
      console.error('Sign up failed in component:', err)
    }
  }

  const renderInfoSide = () => (
    <View style={styles.infoSide}>
      <View style={styles.infoContent}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <LogoSvg width={160} height={60} style={styles.logo} />
        </Animated.View>

        {/* Status badge */}
        <Animated.View
          style={[
            styles.statusBadge,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(translateAnim, 1.2) }]
            }
          ]}
        >
          <View style={styles.statusBadgeInner}>
            <View style={[styles.badgeGradientOverlay, { backgroundColor: Colors.secondary }]} />
            <View style={styles.badgeContent}>
              <View style={styles.liveDotContainer}>
                <Animated.View
                  style={[
                    styles.liveDotPulse,
                    {
                      opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.75]
                      }),
                      backgroundColor: Colors.secondary
                    }
                  ]}
                />
                <View style={[styles.liveDot, { backgroundColor: Colors.secondary }]} />
              </View>
              <Text style={styles.badgeText}>Non-Custodial Wallet • Self-Sovereign Identity • Asset Management</Text>
            </View>
          </View>
        </Animated.View>

        {/* Main heading */}
        <Animated.View
          style={[
            styles.headingContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: Animated.multiply(translateAnim, 1.4)
                }
              ]
            }
          ]}
        >
          <Text style={styles.heading}>Join the Future of</Text>
          <Text style={[styles.heading, styles.headingHighlight]}>Digital & Physical</Text>
          <Text style={styles.heading}>Asset Ownership</Text>
        </Animated.View>

        {/* Subheading text */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: Animated.multiply(translateAnim, 1.6)
              }
            ]
          }}
        >
          <Text style={styles.subheading}>
            Create your secure wallet to start managing your digital tokens and physical assets using advanced
            blockchain technology.
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View
          style={[
            styles.featuresGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(translateAnim, 1.8) }]
            }
          ]}
        >
          <View style={styles.featureCard}>
            <MaterialCommunityIcons name='shield-key' color={Colors.secondary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Self-Sovereign</Text>
            <Text style={styles.featureDescription}>You own your private keys & control your identity</Text>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons
              name='database-lock'
              color={Colors.secondary}
              size={24}
              style={styles.featureIcon}
            />
            <Text style={styles.featureTitle}>Data Sovereignty</Text>
            <Text style={styles.featureDescription}>Your data stays private & encrypted on your device</Text>
          </View>

          <View style={styles.featureCard}>
            <FontAwesome5 name='wallet' color={Colors.secondary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Multi-Asset Wallet</Text>
            <Text style={styles.featureDescription}>Manage crypto, NFTs & physical assets in one place</Text>
          </View>

          <View style={styles.featureCard}>
            <MaterialCommunityIcons
              name='account-check'
              color={Colors.secondary}
              size={24}
              style={styles.featureIcon}
            />
            <Text style={styles.featureTitle}>Easy Onboarding</Text>
            <Text style={styles.featureDescription}>Simple setup with powerful security & backup options</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  )

  const renderFormSide = () => (
    <ScrollView contentContainerStyle={styles.formScrollContainer} keyboardShouldPersistTaps='handled'>
      <Head>
        <title>Sign Up | Team556 Wallet</title>
      </Head>
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text preset='h2' style={styles.formTitle}>
            Create Your Wallet
          </Text>
          <Text style={styles.formSubtitle}>Sign up to start managing your assets securely</Text>

          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <Input
            placeholder='your@email.com'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            style={[genericStyles.input, styles.input]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='mail-outline' size={20} color={Colors.icon} />}
          />

          <Text style={styles.label}>Password</Text>
          <Input
            placeholder='••••••••'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <Input
            placeholder='••••••••'
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[genericStyles.input, styles.input]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
          />

          <View style={styles.referralContainer}>
            <View style={styles.referralHeader}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <Text style={styles.referralBenefit}>🎉 Get rewards when you sign up with a code</Text>
            </View>
            <Input
              placeholder='Enter referral code'
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize='characters'
              style={[genericStyles.input, styles.input, styles.referralInput]}
              placeholderTextColor={Colors.textSecondary}
              leftIcon={<Ionicons name='gift-outline' size={20} color={Colors.primary} />}
              rightIcon={
                referralCode ? (
                  <TouchableOpacity
                    onPress={() => setReferralCode('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name='close-circle' size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>

          <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={styles.signUpButtonContainer}>
            <View style={styles.signUpButton}>
              <Ionicons
                name='person-add-outline'
                size={20}
                color={Colors.backgroundDarkest}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.signUpButtonText}>{isLoading ? 'Creating Account...' : 'Create Wallet'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have a wallet? </Text>
            <Link href='/signin'>
              <Text style={styles.linkText}>Sign In</Text>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Show back button ONLY on native platforms AND when NOT in two-column layout */}
      {Platform.OS !== 'web' && !isTabletOrLarger && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonMobile}>
          <Ionicons name='arrow-back' size={24} color={Colors.text} />
        </TouchableOpacity>
      )}
      <View style={styles.outerContainer}>
        {/* Use two-column layout if the screen is large enough (tablet or desktop/web) */}
        {isTabletOrLarger ? (
          <View style={styles.desktopContainer}>
            {renderInfoSide()}
            {renderFormSide()}
          </View>
        ) : (
          /* Otherwise (smaller screen, likely mobile), show only the form */
          renderFormSide()
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background
  },
  outerContainer: {
    flex: 1
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  infoSide: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRightWidth: 1,
    borderRightColor: Colors.backgroundLight,
    padding: 40,
    justifyContent: 'space-between'
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center'
  },
  // Logo styles
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10
  },
  logo: {
    marginRight: 12
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 1
  },
  // Status badge styles
  statusBadge: {
    marginBottom: 32,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  statusBadgeInner: {
    backgroundColor: Colors.backgroundDarker,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 12,
    position: 'relative'
  },
  badgeGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderRadius: 30
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  liveDotContainer: {
    width: 8,
    height: 8,
    marginRight: 8,
    position: 'relative'
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  liveDotPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 14,
    color: Colors.text
  },
  // Heading styles
  headingContainer: {
    marginBottom: 24
  },
  heading: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44
  },
  headingHighlight: {
    color: Colors.secondary
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 500
  },
  // Feature grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 40,
    gap: 16
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5
  },
  featureIcon: {
    marginBottom: 12
  },
  featureTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  featureDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16
  },
  footer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center'
  },
  // Form styles
  formScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Platform.OS === 'web' ? 40 : 20
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  formTitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.text
  },
  formSubtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    color: Colors.text,
    height: 50
  },
  signUpButtonContainer: {
    borderRadius: 8,
    height: 50,
    marginBottom: 25
  },
  signUpButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.secondary
  },
  signUpButtonText: {
    color: Colors.backgroundDarkest,
    fontWeight: 'bold',
    fontSize: 16
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 13
  },
  linkText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '500'
  },
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
    alignItems: 'center'
  },
  errorText: {
    color: Colors.errorText,
    textAlign: 'center',
    fontSize: 13
  },
  // Referral Input Styles
  referralContainer: {
    marginBottom: 20,
  },
  referralHeader: {
    marginBottom: 8,
  },
  referralBenefit: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  referralInput: {
    backgroundColor: Colors.primarySubtle + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  clearButton: {
    padding: 4,
  },
  backButtonMobile: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 20
  }
})

export default SignUpScreen
