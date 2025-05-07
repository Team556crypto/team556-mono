import React, { useState, useRef, useEffect } from 'react'
import { 
  View, 
  StyleSheet, 
  Alert, 
  SafeAreaView, 
  Platform, 
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native'
import { Button, Input, Text } from '@repo/ui'
import { useRouter, Link } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAuthStore } from '@/store/authStore'
import LogoSvg from '@/assets/images/logo.svg';

const SignUpScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { isTabletOrLarger } = useBreakpoint()
  const { signup, isLoading, error: authError, setError: setAuthError } = useAuthStore()
  const router = useRouter()

  // Animation references for left side
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  
  // Trigger animations on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    setAuthError(null)
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }
    try {
      await signup({ email, password })
      // Navigation is handled by the root _layout based on auth state
    } catch (err) {
      // Error is set in the store
      console.error("Sign up failed in component:", err)
    }
  }

  const renderInfoSide = () => (
    <View style={styles.infoSide}>
      <View style={styles.infoContent}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <LogoSvg width={60} height={60} style={styles.logo} />
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
            <View style={styles.badgeContent}>
              <View style={styles.liveDotContainer}>
                <Animated.View style={[styles.liveDotPulse, {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.75]
                  })
                }]} />
                <View style={styles.liveDot} />
              </View>
              <Text style={styles.badgeText}>
                Non-Custodial Wallet • Self-Sovereign Identity • Asset Management
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Main heading */}
        <Animated.View
          style={[
            styles.headingContainer,
            {
              opacity: fadeAnim,
              transform: [{ 
                translateY: Animated.multiply(translateAnim, 1.4) 
              }]
            }
          ]}
        >
          <Text style={styles.heading}>
            Join the Future of 
          </Text>
          <Text style={[styles.heading, styles.headingHighlight]}>
            Digital & Physical
          </Text>
          <Text style={styles.heading}>
            Asset Ownership
          </Text>
        </Animated.View>

        {/* Subheading text */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ 
              translateY: Animated.multiply(translateAnim, 1.5) 
            }]
          }}
        >
          <Text style={styles.subheading}>
            Create your account to experience the future of digital asset management. Take control of your wealth with cutting-edge security and blockchain technology.
          </Text>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateAnim, 1.6) }]
          }}
        >
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="shield-key" size={32} color={Colors.solanaMain} />
              </View>
              <Text style={styles.featureTitle}>Self-Sovereign</Text>
              <Text style={styles.featureDescription}>
                You own your private keys and maintain full control of your assets
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <FontAwesome5 name="exchange-alt" size={32} color={Colors.solanaMain} />
              </View>
              <Text style={styles.featureTitle}>Seamless Swaps</Text>
              <Text style={styles.featureDescription}>
                Trade between cryptocurrencies with low fees and high security
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="database-lock" size={32} color={Colors.solanaMain} />
              </View>
              <Text style={styles.featureTitle}>Secure Storage</Text>
              <Text style={styles.featureDescription}>
                End-to-end encryption for all your digital asset information
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="analytics" size={32} color={Colors.solanaMain} />
              </View>
              <Text style={styles.featureTitle}>Portfolio Tracking</Text>
              <Text style={styles.featureDescription}>
                Real-time tracking of your digital asset portfolio
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateAnim, 1.7) }]
          }}
        >
          <Text style={styles.footer}>
            2025 Team556 • All Rights Reserved
          </Text>
        </Animated.View>
      </View>
    </View>
  )

  const renderFormSide = () => (
    <ScrollView 
      contentContainerStyle={styles.formScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text preset="h3" style={styles.formTitle}>
            Create Account
          </Text>
          
          <Text style={styles.formSubtitle}>
            Join our platform to manage your digital assets securely
          </Text>
          
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          
          <Text style={styles.label}>Email Address</Text>
          <Input
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail" size={18} color={Colors.textSecondary} />}
          />
          
          <Text style={styles.label}>Password</Text>
          <Input
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            leftIcon={<Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />}
          />
          
          <Text style={styles.label}>Confirm Password</Text>
          <Input
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={Colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            leftIcon={<Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />}
          />
          
          <View style={styles.signUpButtonContainer}>
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/signin" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.container}>
      {!isTabletOrLarger && (
        <TouchableOpacity 
          style={styles.backButtonMobile}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      )}
      
      <View style={styles.mainContainer}>
        {isTabletOrLarger && renderInfoSide()}
        {renderFormSide()}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.solanaNavy,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Info side styles
  infoSide: {
    flex: 1,
    backgroundColor: Colors.solanaNavy,
    padding: 40,
    justifyContent: 'center',
    display: 'flex',
  },
  infoContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
  },
  // Status badge
  statusBadge: {
    marginBottom: 32,
  },
  statusBadgeInner: {
    backgroundColor: Colors.solanaPurple,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    position: 'relative',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDotContainer: {
    width: 8,
    height: 8,
    marginRight: 8,
    position: 'relative',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.solanaMain,
  },
  liveDotPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.solanaMain,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.text,
  },
  // Heading styles
  headingContainer: {
    marginBottom: 24,
  },
  heading: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  headingHighlight: {
    color: Colors.solanaMain,
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 500,
  },
  // Feature grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 40,
    gap: 16,
  },
  featureCard: {
    flex: 1, 
    minWidth: '45%',
    backgroundColor: Colors.solanaDark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  // Form styles
  formScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.solanaNavy,
    padding: Platform.OS === 'web' ? 40 : 20,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.solanaDark,
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.text,
  },
  formSubtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.solanaNavy,
    borderWidth: 1,
    borderColor: Colors.solanaPurple,
    borderRadius: 8,
    marginBottom: 15,
    color: Colors.text,
    height: 50,
  },
  signUpButtonContainer: {
    borderRadius: 8,
    height: 50,
    marginBottom: 25,
  },
  signUpButton: {
    flex: 1, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.solanaMain,
  },
  signUpButtonText: {
    color: Colors.solanaDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  linkText: {
    color: Colors.solanaMain,
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.errorText,
    textAlign: 'center',
    fontSize: 13,
  },
  backButtonMobile: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: Colors.solanaDark,
    borderRadius: 20,
  },
})

export default SignUpScreen
