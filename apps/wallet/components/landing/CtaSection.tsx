import React, { useRef } from 'react';
import { View, StyleSheet, Platform, Dimensions, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import { Feather, Ionicons } from '@expo/vector-icons'; // Import Feather and Ionicons

interface CtaSectionProps {
  onCreateWallet?: () => void;
  onLogin?: () => void;
}

interface FeatureItem {
  text: string;
  iconElement: React.ReactNode; // Store the actual JSX element
}

const CtaSection: React.FC<CtaSectionProps> = ({
  onCreateWallet,
  onLogin,
}) => {
  const router = useRouter();

  // Navigation functions
  const navigateToCreateWallet = () => {
    if (onCreateWallet) {
      onCreateWallet();
    } else {
      router.push('/onboarding');
    }
  };

  const navigateToLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      router.push('/login');
    }
  };

  // Define features with pre-built icon elements
  const features: FeatureItem[] = [
    {
      text: 'Secure Digital Armory',
      iconElement: <Feather name="shield" size={18} color={Colors.primary || '#9945FF'} />,
    },
    {
      text: 'Document Management',
      iconElement: <Ionicons name="document-lock-outline" size={18} color="#44b0ff" />,
    },
    {
      text: 'Ammo Inventory',
      iconElement: <Feather name="check-circle" size={18} color={Colors.secondary || '#14F195'} />,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* CTA Card */}
        <View style={styles.ctaCard}>
          {/* Decorative top border */}
          <View style={styles.decorativeBorder} />

          {/* Grid pattern overlay - for web only */}
          {Platform.OS === 'web' && (
            <View style={styles.gridPatternOverlay} />
          )}

          <View style={styles.cardContent}>
            {/* Main content - split into two columns on larger screens */}
            <View style={styles.contentLayout}>
              {/* Left Column - CTA Content */}
              <View style={styles.leftColumn}>
                {/* Badge */}
                <View style={styles.badgeContainer}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Advanced Security</Text>
                </View>

                {/* Simple direct heading - maximum visibility */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ 
                    fontSize: 44, 
                    fontWeight: 'bold', 
                    color: Colors.text, 
                    textAlign: isLargeScreen ? 'left' : 'center',
                    marginTop: 16,
                  }}>
                    Protect Your
                  </Text>
                  <View style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: 'rgba(20, 241, 149, 0.1)',
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: Colors.secondary,
                    alignSelf: isLargeScreen ? 'flex-start' : 'center'
                  }}>
                    <Text style={{ 
                      fontSize: 44, 
                      fontWeight: 'bold', 
                      color: Colors.text, 
                      textAlign: isLargeScreen ? 'left' : 'center',
                    }}>
                      Digital Armory
                    </Text>
                  </View>
                </View>

                <Text style={styles.description}>
                  Join the growing community of firearm owners turning to Team556 for secure, private, blockchain-connected tools. Take control of your collection with confidence—on your terms.
                </Text>

                {/* Trust indicators */}
                <View style={styles.trustIndicators}>
                  <View style={styles.trustItem}>
                    <Feather 
                      name="shield" 
                      size={16} 
                      color={Colors.secondary || '#14F195'} 
                      style={styles.checkIcon} 
                    />
                    <Text style={styles.trustText}>Zero-knowledge encryption</Text>
                  </View>
                  
                  <View style={styles.trustItem}>
                    <Ionicons 
                      name="document-lock-outline" 
                      size={16} 
                      color={Colors.secondary || '#14F195'} 
                      style={styles.checkIcon} 
                    />
                    <Text style={styles.trustText}>Solana blockchain powered</Text>
                  </View>
                  
                  <View style={styles.trustItem}>
                    <Feather 
                      name="check-circle" 
                      size={16} 
                      color={Colors.secondary || '#14F195'} 
                      style={styles.checkIcon} 
                    />
                    <Text style={styles.trustText}>24/7 secure access</Text>
                  </View>
                </View>
              </View>

              {/* Right Column - Feature Showcase */}
              <View style={styles.rightColumn}>
                <View style={styles.featureShowcaseWrapper}>
                  <View style={styles.featureShowcaseInner}>
                    {/* Feature cards */}
                    <View style={styles.featureCards}>
                      {features.map((feature, index) => (
                        <Pressable key={index} style={({ pressed }) => [
                          styles.featureCard,
                          pressed && styles.featureCardPressed
                        ]}>
                          <View style={styles.featureCardContent}>
                            {/* Render the pre-built icon element */}
                            {feature.iconElement}
                            <View style={styles.featureTextContainer}>
                              <Text style={styles.featureTitle}>{feature.text}</Text>
                              <Text style={styles.featureDescription}>Track your entire collection with detailed records</Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>

                    {/* Users counter */}
                    <View style={styles.usersCounter}>
                      <View style={styles.usersCounterContent}>
                        <View style={styles.userTextContainer}>
                          <Text style={styles.featureTitle}>Firearms enthusiasts trust Team556</Text>
                        </View>
                        <View style={styles.userAvatars}>
                          <View style={[styles.userAvatar, styles.userAvatar1]}>
                            <Text style={styles.userInitial}>JD</Text>
                          </View>
                          <View style={[styles.userAvatar, styles.userAvatar2]}>
                            <Text style={styles.userInitial}>AT</Text>
                          </View>
                          <View style={[styles.userAvatar, styles.userAvatar3]}>
                            <Text style={styles.userInitial}>MB</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Decorative elements for the feature showcase */}
                <View style={styles.featureDecor1} />
                <View style={styles.featureDecor2} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 64,
    position: 'relative',
    overflow: 'hidden',
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  ctaCard: {
    backgroundColor: Colors.backgroundDarkest, // Use consistent background color from Colors
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.primary || '#9945FF',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, #9945FF, #44b0ff, #14F195)',
    } : {}),
  },
  gridPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // For web, we'd include a background pattern
  },
  cardContent: {
    padding: isLargeScreen ? 64 : 24,
    position: 'relative',
  },
  contentLayout: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    alignItems: 'center',
    gap: isLargeScreen ? 48 : 32,
  },
  leftColumn: {
    flex: isLargeScreen ? 0.6 : 1,
    alignItems: isLargeScreen ? 'flex-start' : 'center',
  },
  rightColumn: {
    flex: isLargeScreen ? 0.4 : 1,
    position: 'relative',
    alignItems: 'center',
    marginTop: isLargeScreen ? 0 : 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: 24,
    alignSelf: isLargeScreen ? 'flex-start' : 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary || '#14F195',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text || '#FFFFFF',
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    maxWidth: 560,
    textAlign: isLargeScreen ? 'left' : 'center',
  },
  ctaButtons: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    gap: 20,
    marginBottom: 32,
    width: isLargeScreen ? 'auto' : '100%',
  },
  createVaultButton: {
    backgroundColor: Colors.primary || '#9945FF',
    shadowColor: 'rgba(153, 69, 255, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: Colors.text || '#FFFFFF',
  },
  arrowPoint: {
    position: 'absolute',
    right: 0,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.text || '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  loginButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trustIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'center',
    justifyContent: isLargeScreen ? 'flex-start' : 'center',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 6,
  },
  trustText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  featureShowcaseWrapper: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(153, 69, 255, 0.2)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    transform: [{ rotate: '1deg' }],
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.4), rgba(68, 176, 255, 0.4), rgba(20, 241, 149, 0.4))',
    } : {}),
  },
  featureShowcaseInner: {
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 20,
  },
  featureCards: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    padding: 16,
    marginBottom: 12,
  },
  featureCardPressed: {
    backgroundColor: 'rgba(40, 40, 50, 0.5)',
    transform: [{ translateY: -4 }],
  },
  featureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  primaryIconContainer: {
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderColor: 'rgba(153, 69, 255, 0.3)',
  },
  blueIconContainer: {
    backgroundColor: 'rgba(68, 176, 255, 0.2)',
    borderColor: 'rgba(68, 176, 255, 0.3)',
  },
  secondaryIconContainer: {
    backgroundColor: 'rgba(20, 241, 149, 0.2)',
    borderColor: 'rgba(20, 241, 149, 0.3)',
  },
  ammoIconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ammoIconBody: {
    width: 12,
    height: 16,
    borderRadius: 3,
    backgroundColor: Colors.secondary || '#14F195',
  },
  ammoIconTop: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 2,
    backgroundColor: Colors.secondary || '#14F195',
  },
  ammoIconDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text || '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  newBadge: {
    backgroundColor: 'rgba(20, 241, 149, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.3)',
  },
  newBadgeText: {
    color: Colors.secondary || '#14F195',
    fontSize: 10,
    fontWeight: 'bold',
  },
  usersCounter: {
    marginTop: 12,
    backgroundColor: 'rgba(30, 30, 40, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    padding: 16,
  },
  usersCounterContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  userTextContainer: {
    width: '100%',
    marginBottom: 4,
  },
  usersCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text || '#FFFFFF',
  },
  usersDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  userAvatars: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0f',
    marginRight: 6,
  },
  userAvatar1: {
    backgroundColor: Colors.primary || '#9945FF',
    zIndex: 4,
  },
  userAvatar2: {
    backgroundColor: '#44b0ff',
    zIndex: 3,
  },
  userAvatar3: {
    backgroundColor: Colors.secondary || '#14F195',
    zIndex: 2,
  },
  userAvatarCount: {
    backgroundColor: 'rgba(50, 50, 60, 0.9)',
    zIndex: 1,
  },
  userInitial: {
    color: Colors.text || '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureDecor1: {
    position: 'absolute',
    bottom: -16,
    right: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    ...(Platform.OS === 'web' ? {
      filter: 'blur(30px)',
    } : {}),
  },
  featureDecor2: {
    position: 'absolute',
    top: -16,
    left: -16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20, 241, 149, 0.2)',
    ...(Platform.OS === 'web' ? {
      filter: 'blur(30px)',
    } : {}),
  },
});

export default CtaSection;
