import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated
} from 'react-native';
import { Button, Input, Text } from '@repo/ui';
import { useRouter, Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuthStore } from '@/store/authStore';
import LogoSvg from '@/assets/images/logo.svg';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();
  const { isTabletOrLarger } = useBreakpoint();
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthStore();
  
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
      })
    ]).start();
  }, [fadeAnim, translateAnim]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await login({ email, password });
      // Navigation handled by root layout
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  const renderInfoSide = () => (
    <View style={styles.infoSide}>
      <View style={styles.infoContent}>
        {/* Logo and brand */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }]
          }}
        >
          <View style={styles.logoContainer}>
            <LogoSvg width={60} height={60} style={styles.logo} />
          </View>
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
                Blockchain Secured • Military-Grade Encryption • Zero Knowledge
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Main heading with animated reveal */}
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
            The Ultimate Platform for
          </Text>
          <Text style={[styles.heading, styles.headingHighlight]}>
            Digital & Physical Asset
          </Text>
          <Text style={styles.heading}>
            Security
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
            A fully-integrated platform that combines the power of blockchain with physical asset management for unparalleled security and convenience.
          </Text>
        </Animated.View>

        {/* Feature grid */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateAnim, 1.6) }]
          }}
        >
          <View style={styles.featuresGrid}>
            {/* Secure Storage Feature */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Secure Storage</Text>
              <Text style={styles.featureDescription}>
                Military-grade encryption for all your digital and physical assets
              </Text>
            </View>

            {/* Multi-Currency Feature */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="wallet" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Multi-Currency</Text>
              <Text style={styles.featureDescription}>
                Support for a wide range of digital currencies and tokens
              </Text>
            </View>

            {/* Zero-Knowledge Feature */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="eye-off" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Zero-Knowledge</Text>
              <Text style={styles.featureDescription}>
                Your private keys and data never leave your device
              </Text>
            </View>

            {/* Asset Tracking Feature */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="locate" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Asset Tracking</Text>
              <Text style={styles.featureDescription}>
                Real-time tracking and management for all your assets
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
  );

  const renderFormSide = () => (
    <ScrollView 
      contentContainerStyle={styles.formScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text preset="h3" style={styles.formTitle}>
            Sign In
          </Text>
          
          <Text style={styles.formSubtitle}>
            Welcome back! Please sign in to access your account.
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
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Feather name="mail" size={18} color={Colors.textSecondary} />}
          />
          
          <Text style={styles.label}>Password</Text>
          <Input
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            leftIcon={<Feather name="lock" size={18} color={Colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            }
          />
          
          <View style={styles.rowContainer}>
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                style={styles.switch}
                trackColor={{ false: Colors.backgroundDark, true: Colors.primary }}
                thumbColor={rememberMe ? Colors.text : Colors.textSecondary}
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>
            
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.signInButtonContainer}>
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.createAccountContainer}>
            <Text style={styles.createAccountText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Create an account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );

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
  );
};

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
  badgeGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderRadius: 30,
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
    color: Colors.solanaPurpleLight,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    transform: Platform.OS === 'ios' ? [] : [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginRight: 8,
  },
  rememberMeText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  linkText: {
    color: Colors.solanaMain,
    fontSize: 13,
    fontWeight: '500',
  },
  signInButtonContainer: {
    borderRadius: 8,
    height: 50,
    marginBottom: 25,
  },
  signInButton: {
    flex: 1, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.solanaMain,
  },
  signInButtonText: {
    color: Colors.solanaDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountText: {
    color: Colors.textSecondary,
    fontSize: 13,
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
});

export default SignInScreen;
