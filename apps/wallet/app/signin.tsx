import React, { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, SafeAreaView, Platform, TouchableOpacity, ScrollView, Switch, Animated } from 'react-native'
import { Button, Input, Text } from '@team556/ui'
import { useRouter, Link } from 'expo-router'
import Head from 'expo-router/head'
import { genericStyles } from '@/constants/GenericStyles'
import { Colors } from '@/constants/Colors'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import LogoSvg from '@/assets/images/logo-wide.svg'
import LogoIconSvg from '@/assets/images/logo.svg'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SignInScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const router = useRouter()
  const { isTabletOrLarger } = useBreakpoint()
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthStore()

  // Animation references for left side
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateAnim = useRef(new Animated.Value(20)).current

  // Trigger animations on component mount
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

    // Load remember me preference
    const loadRecalledUser = async () => {
      try {
        let recalledEmail = null
        let shouldRemember = false

        if (Platform.OS === 'web') {
          const storedEmail = localStorage.getItem('rememberedEmail')
          const storedRememberMe = localStorage.getItem('rememberMe')
          if (storedRememberMe === 'true' && storedEmail) {
            recalledEmail = storedEmail
            shouldRemember = true
          }
        } else {
          const storedEmail = await AsyncStorage.getItem('rememberedEmail')
          const storedRememberMe = await AsyncStorage.getItem('rememberMe')
          if (storedRememberMe === 'true' && storedEmail) {
            recalledEmail = storedEmail
            shouldRemember = true
          }
        }

        if (shouldRemember && recalledEmail) {
          setEmail(recalledEmail)
          setRememberMe(true)
        }
      } catch (e) {
        console.error('Failed to load remember me preference', e)
      }
    }
    loadRecalledUser()
  }, [fadeAnim, translateAnim])

  const handleSignIn = async () => {
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    try {
      await login({ email, password });

      // Save or clear remember me preference
      if (rememberMe) {
        if (Platform.OS === 'web') {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.setItem('rememberedEmail', email);
          await AsyncStorage.setItem('rememberMe', 'true');
        }
      } else {
        if (Platform.OS === 'web') {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
          await AsyncStorage.removeItem('rememberMe');
        }
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      // The authStore already sets the error message, so no need to set it here unless you want to override it.
    }
  };

  const renderInfoSide = () => (
    <View style={styles.infoSide}>
      <View style={styles.infoContent}>
        {/* Logo and brand - keep logo but enhance style */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }]
          }}
        >
          <View style={styles.logoContainer}>
            <LogoSvg width={160} height={60} style={styles.logo} />
          </View>
        </Animated.View>

        {/* Status badge - similar to HeroSection */}
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
            <View style={styles.badgeGradientOverlay} />
            <View style={styles.badgeContent}>
              <View style={styles.liveDotContainer}>
                <Animated.View
                  style={[
                    styles.liveDotPulse,
                    {
                      opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.75]
                      })
                    }
                  ]}
                />
                <View style={styles.liveDot} />
              </View>
              <Text style={styles.badgeText}>Blockchain Secured • Military-Grade Encryption • Zero Knowledge</Text>
            </View>
          </View>
        </Animated.View>

        {/* Main heading with animated reveal */}
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
          <Text style={styles.heading}>The Ultimate Platform for</Text>
          <Text style={[styles.heading, styles.headingHighlight]}>Digital & Physical Asset</Text>
          <Text style={styles.heading}>Security</Text>
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
            Secure your firearms data and digital assets with blockchain technology and local encryption.
          </Text>
        </Animated.View>

        {/* Features grid with cards */}
        <Animated.View
          style={[
            styles.featuresGrid,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: Animated.multiply(translateAnim, 1.8)
                }
              ]
            }
          ]}
        >
          <View style={styles.featureCard}>
            <Feather name='shield' color={Colors.primary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Digital Armory</Text>
            <Text style={styles.featureDescription}>Military-grade encryption for your data & assets</Text>
          </View>

          <View style={styles.featureCard}>
            <Feather name='lock' color={Colors.primary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Blockchain Security</Text>
            <Text style={styles.featureDescription}>Decentralized protection for digital & physical assets</Text>
          </View>

          <View style={styles.featureCard}>
            <Feather name='layers' color={Colors.primary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Comprehensive Management</Text>
            <Text style={styles.featureDescription}>Track firearms, ammo, documents & crypto in one place</Text>
          </View>

          <View style={styles.featureCard}>
            <Feather name='user-check' color={Colors.secondary} size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Private & Compliant</Text>
            <Text style={styles.featureDescription}>Regulatory compliance with uncompromised privacy</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.footer}>Team556 FMS • v1.0.0 • Secure Digital & Physical Assets</Text>
      </Animated.View>
    </View>
  )

  const renderFormSide = () => (
    <ScrollView contentContainerStyle={styles.formScrollContainer} keyboardShouldPersistTaps='handled'>
      <Head>
        <title>Sign In | Team556 Wallet</title>
      </Head>
      <View style={styles.formContainer}>
        {!isTabletOrLarger && (
          <View style={styles.brandContainer}>
            <LogoIconSvg width={120} height={120} />
              <Text style={styles.welcomeTitle}>Welcome to Team556</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to access your Digital Armory</Text>
          </View>
        )}
        <View style={styles.formCard}>
          {isTabletOrLarger && (
            <> 
              <Text preset='h2' style={styles.formTitle}>
            Welcome Back
          </Text>
              <Text style={styles.formSubtitle}>Sign in to access your secure digital vault</Text>
            </>
          )}

          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <Text style={styles.label}>Email or Username</Text>
          <Input
            placeholder='Email or Username'
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
            secureTextEntry={!isPasswordVisible}
            style={[genericStyles.input, styles.input]}
            placeholderTextColor={Colors.textSecondary}
            leftIcon={<Ionicons name='lock-closed-outline' size={20} color={Colors.icon} />}
            rightIcon={
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.icon} />
              </TouchableOpacity>
            }
          />

          <View style={styles.rowContainer}>
            <View style={styles.rememberMeContainer}>
              <Switch
                trackColor={{ false: Colors.background, true: Colors.primary }}
                thumbColor={rememberMe ? Colors.primary : Colors.textSecondary}
                ios_backgroundColor={Colors.background}
                onValueChange={setRememberMe}
                value={rememberMe}
                style={styles.switch}
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/auth/ForgotPasswordScreen' as any)}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSignIn} disabled={isLoading} style={styles.signInButtonContainer}>
            <View style={styles.signInButton}>
              <Ionicons name='log-in-outline' size={20} color={Colors.backgroundDarkest} style={{ marginRight: 8 }} />
              <Text style={styles.signInButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.createAccountContainer}>
            <Text style={styles.createAccountText}>Don't have an account? </Text>
            <Link href='/signup'>
              <Text style={styles.linkText}>Create Wallet</Text>
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
    marginBottom: 8,
    marginTop: 44
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
    backgroundColor: Colors.primary,
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
    borderRadius: 4,
    backgroundColor: Colors.success
  },
  liveDotPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success
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
    color: Colors.primary
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
  // Form styles - keeping unchanged
  formScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDarkest,
    padding: Platform.OS === 'web' ? 40 : 20
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    borderColor: Colors.border,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  switch: {
    transform: Platform.OS === 'ios' ? [] : [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginRight: 8
  },
  rememberMeText: {
    color: Colors.textSecondary,
    fontSize: 13
  },
  linkText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500'
  },
  signInButtonContainer: {
    borderRadius: 8,
    height: 50,
    marginBottom: 25
  },
  signInButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.primary
  },
  signInButtonText: {
    color: Colors.backgroundDarkest,
    fontWeight: 'bold',
    fontSize: 16
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  createAccountText: {
    color: Colors.textSecondary,
    fontSize: 13
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
  backButtonMobile: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: Colors.backgroundDarker,
    borderRadius: 20
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 10 // Adjust as needed for spacing before the main button
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  // Branding styles for mobile landing
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  welcomeTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center'
  },
  welcomeSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center'
  }
})

export default SignInScreen
