import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Button, Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import LogoSvg from '@/assets/images/logo.svg';
import DashboardMockup from './DashboardMockup'; // Import the DashboardMockup component
import { useBreakpoint } from '@/hooks/useBreakpoint'; // Import the hook
import { useRouter } from 'expo-router'; // Import useRouter

interface HeroSectionProps {
  onCreateWallet?: () => void;
  onLogin?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onCreateWallet = () => {},
  onLogin = () => {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const rotateXAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const { isTabletOrLarger } = useBreakpoint(); // Use the hook
  const router = useRouter(); // Initialize router

  // Trigger animations after component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Start animations
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
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fadeAnim, translateAnim]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: translateAnim,
      },
      {
        rotateX: rotateXAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-5deg', '5deg'], 
        }),
      },
      {
        rotateY: rotateYAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['15deg', '-15deg'], 
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={[styles.contentContainer, isTabletOrLarger && styles.contentContainerLarge]}>
        <View style={[styles.heroFlexContainer, isTabletOrLarger && styles.heroFlexContainerLarge]}>
          {/* Left Column - Hero Content */}
          <View style={[styles.leftColumn, isTabletOrLarger && styles.leftColumnLarge]}>
            {/* Animated status badge */}
            <Animated.View 
              style={[
                styles.statusBadge,
                isTabletOrLarger && styles.statusBadgeLarge,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateAnim }]
                }
              ]}
            >
              <View style={styles.statusBadgeInner}>
                <View style={styles.badgeGradientOverlay} />
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
                    Blockchain Secured • Advanced Security Encryption • Zero Knowledge
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Heading with animated reveal */}
            <Animated.View
              style={[
                styles.headingContainer,
                isTabletOrLarger && styles.headingContainerLarge,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: Animated.multiply(translateAnim, 1.2) 
                  }]
                }
              ]}
            >
              <Text style={[styles.heading, isTabletOrLarger && styles.headingLarge]}>Your Complete</Text>
              <Text style={[styles.heading, isTabletOrLarger && styles.headingLarge, { color: Colors.secondary, marginTop: 4, marginBottom: 24 }]}>
                Digital Armory
              </Text>
              
              <Text style={[styles.subheading, isTabletOrLarger && styles.subheadingLarge]}>
                Secure Your Assets, On Your Terms
                {'\n\n'}
                Manage your Team556 tokens, SOL, and firearm-related records in one streamlined wallet built for privacy and control. All data stays local to your device—never on-chain or in the cloud. With secure transaction handling on the Solana blockchain and offline storage for sensitive info, it's a purpose-built platform for those who value freedom, privacy, and preparedness.
              </Text>
            </Animated.View>

            {/* Action buttons */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                isTabletOrLarger && styles.buttonContainerLarge,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: Animated.multiply(translateAnim, 1.5) 
                  }]
                }
              ]}
            >
              <Button
                title="Create Your Armory"
                variant="primary"
                size="large"
                leftIcon={<Feather name="edit-2" color="white" size={18} />}
                style={styles.createWalletButton}
                onPress={() => router.push('/signup')} // Add onPress handler
              />
              
              <Button
                title="Login"
                variant="outline"
                size="large"
                style={styles.loginButton}
                onPress={onLogin}
              />
            </Animated.View>

            {/* Feature indicators */}
            <Animated.View 
              style={[
                styles.featuresGrid,
                isTabletOrLarger && styles.featuresGridLarge,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: Animated.multiply(translateAnim, 1.8) 
                  }]
                }
              ]}
            >
              <View style={styles.featureCard}>
                <Feather name="shield" color={Colors.primary} size={20} style={styles.featureIcon} />
                <Text style={styles.featureText}>Multi-Asset Wallet</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Feather name="zap" color={Colors.primary} size={20} style={styles.featureIcon} />
                <Text style={styles.featureText}>Solana-Powered</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Ionicons name="wallet-outline" color={Colors.secondary} size={20} style={styles.featureIcon} />
                <Text style={styles.featureText}>Advanced Security</Text>
              </View>
            </Animated.View>
          </View>

          {/* Right Column - Mockup */}
          {isTabletOrLarger && (
            <View style={styles.rightColumn}>
              <Animated.View
                style={[
                  styles.mockupContainer,
                  animatedStyle
                ]}
              >
                <DashboardMockup />
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 1024;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest,
    minHeight: height,
    paddingTop: 80, // Space for the header
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    maxWidth: 1280,
    marginHorizontal: 'auto',
    width: '100%',
    justifyContent: 'center',
  },
  contentContainerLarge: {
    maxWidth: 1280,
    marginHorizontal: 'auto',
  },
  heroFlexContainer: {
    flexDirection: 'column', // Default to column
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroFlexContainerLarge: {
    flexDirection: 'row', // Row on large screens
  },
  leftColumn: {
    width: '100%', // Full width on small screens
    alignItems: 'center', // Center on small screens
  },
  leftColumnLarge: {
    width: '50%', // Half width on large screens
    alignItems: 'flex-start', // Align left on large screens
  },
  rightColumn: {
    width: '50%',
    display: 'flex', // Only display needs to be managed here
    justifyContent: 'center',
    alignItems: 'center',
    perspective: '2000px', // Changed from number to string for TypeScript compatibility
  },
  statusBadge: {
    marginBottom: 24,
    alignSelf: 'center', // Center on small screens
    overflow: 'hidden',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start', // Align left on large screens
  },
  statusBadgeInner: {
    backgroundColor: Colors.backgroundDarker,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 12,
    position: 'relative',
  },
  badgeGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    backgroundColor: Colors.primarySubtle,
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
    backgroundColor: Colors.success,
  },
  liveDotPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    // Additional animation would be applied via Animated API if needed
  },
  badgeText: {
    fontSize: 14,
    color: Colors.text,
  },
  headingContainer: {
    marginBottom: 24,
    alignItems: 'center', // Center on small screens
  },
  headingContainerLarge: {
    alignItems: 'flex-start', // Align left on large screens
  },
  heading: {
    color: Colors.text,
    fontSize: 36, // Smaller on mobile
    fontWeight: 'bold',
    textAlign: 'center', // Center on small screens
    marginBottom: 8,
  },
  headingLarge: {
    fontSize: 46, // Larger on desktop
    textAlign: 'left', // Align left on large screens
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center', // Center on small screens
    maxWidth: 600,
  },
  subheadingLarge: {
    textAlign: 'left', // Align left on large screens
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center on small screens
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  buttonContainerLarge: {
    justifyContent: 'flex-start', // Align left on large screens
  },
  createWalletButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary + '4D', // Add opacity to primary color for shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButton: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'center', // Center on small screens
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    maxWidth: 600,
  },
  featuresGridLarge: {
    justifyContent: 'flex-start', // Align left on large screens
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  mockupContainer: {
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    // For web transform style
    ...(Platform.OS === 'web' ? {
      transformStyle: 'preserve-3d',
    } : {}),
  },
});

export default HeroSection;
