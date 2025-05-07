import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from '@repo/ui';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Feature {
  title: string;
  description: string;
  iconElement: React.ReactNode;
  color: string;
}

const FeaturesSection: React.FC = () => {
  const { isTabletOrLarger } = useBreakpoint();

  const getFeatureIconColor = (colorName: string): string => {
    switch (colorName) {
      case 'solana-icon': return Colors.secondary || '#14F195';
      case 'firearms-icon': return Colors.primary || '#AE6CFE';
      case 'ammo-icon': return Colors.error || '#ff5252';
      case 'documents-icon': return Colors.success || '#4caf50';
      case 'security-icon': return Colors.textSecondary || '#9BA1A6';
      default: return Colors.text || '#ECEDEE';
    }
  };

  const features: Feature[] = [
    {
      title: 'Team556 Wallet',
      description:
        'A purpose-built Solana wallet designed for the firearms industry. Securely send, receive, and manage SOL and Team556 tokens with ease. Built for privacy, speed, and simplicity—no unnecessary features, just what you need to transact without compromise.',
      iconElement: <Ionicons name="wallet-outline" size={24} color={getFeatureIconColor('solana-icon')} />,
      color: 'solana-icon'
    },
    {
      title: 'DeFi Integration',
      description:
        "Integrate directly with Solana's DeFi infrastructure while supporting the firearms industry. Provide liquidity to strengthen the Team556 ecosystem and access decentralized trading on platforms like Jupiter and Raydium. Whether you're a firearms retailer or a 2A supporter, your participation helps build a censorship-resistant payment network designed for real-world use—low fees, instant settlement, and no chargebacks.",
      iconElement: <Feather name="shield" size={24} color={getFeatureIconColor('solana-icon')} />,
      color: 'solana-icon'
    },
    {
      title: 'Firearm Inventory',
      description:
        'Easily keep track of your personal firearms collection. Store serial numbers, purchase dates, maintenance logs, and other important details—all in one secure place. Designed for gun owners who want better organization, not surveillance. Your data stays private and local, never shared or stored on-chain.',
      iconElement: <Feather name="clipboard" size={24} color={getFeatureIconColor('firearms-icon')} />,
      color: 'firearms-icon'
    },
    {
      title: 'Ammunition Tracking',
      description: `Keep a detailed log of your ammo supply across all calibers and brands. Track round counts, purchase dates, storage locations, and range usage over time. Easily see what you're low on before your next range day or emergency loadout. Designed for gun owners who take preparedness seriously—because knowing your inventory matters when it counts.`,
      iconElement: <Feather name="zap" size={24} color={getFeatureIconColor('ammo-icon')} />,
      color: 'ammo-icon'
    },
    {
      title: 'Documents',
      description: "Keep your important firearm-related documents safe and organized. Store encrypted copies of your licenses, training certificates, purchase records, and legal paperwork—all in one private, easy-to-access location. Everything stays on your device, under your control, with no third-party access or cloud syncing.",
      iconElement: <Ionicons name="document-text-outline" size={24} color={getFeatureIconColor('documents-icon')} />,
      color: 'documents-icon'
    },
    {
      title: 'Advanced Security',
      description: "Your data stays private and protected with end-to-end encryption, secure local key storage, and robust authentication protocols. Whether you're managing firearm details, documents, or transaction history, everything is locked to your device—never shared, never stored in the cloud, and never accessible without your permission. Built for those who value control, privacy, and peace of mind.",
      iconElement: <Feather name="shield" size={24} color={getFeatureIconColor('security-icon')} />,
      color: 'security-icon'
    }
  ];

  const getFeatureIconContainerStyle = (color: string) => {
    switch (color) {
      case 'solana-icon':
        return styles.solanaIconContainer;
      case 'firearms-icon':
        return styles.firearmsIconContainer;
      case 'ammo-icon':
        return styles.ammoIconContainer;
      case 'documents-icon':
        return styles.documentsIconContainer;
      case 'security-icon':
        return styles.securityIconContainer;
      default:
        return styles.defaultIconContainer;
    }
  };

  const getTopIndicatorStyle = (color: string) => {
    switch (color) {
      case 'solana-icon':
        return styles.solanaIndicator;
      case 'firearms-icon':
      case 'nfa-icon':
        return styles.primaryIndicator;
      case 'ammo-icon':
      case 'security-icon':
        return styles.secondaryIndicator;
      default:
        return styles.defaultIndicator;
    }
  };

  const getLearnMoreTextStyle = (color: string) => {
    switch (color) {
      case 'solana-icon':
        return styles.solanaText;
      case 'firearms-icon':
      case 'nfa-icon':
        return styles.primaryText;
      case 'ammo-icon':
      case 'security-icon':
        return styles.secondaryText;
      default:
        return styles.defaultText;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
      </View>

      <View style={styles.contentContainer}>
        {/* Section header */}
        <View style={styles.headerContainer}>
          {/* Decorative badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Built for the Community</Text>
          </View>

          <Text style={[styles.heading, isTabletOrLarger ? styles.headingLarge : {}]}>Core Features</Text>
          <Text style={[styles.subheading, isTabletOrLarger ? styles.subheadingLarge : {}]}>
            Team556 Wallet combines secure Solana transactions with practical tools for firearms enthusiasts.
          </Text>
        </View>

        {/* Features grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, isTabletOrLarger ? styles.featureCardTablet : {}]}>
              <Pressable
                style={({ pressed }) => [
                  styles.featureCardContent,
                  pressed && styles.featureCardPressed
                ]}
              >
                <View style={styles.featureCardContent}>
                  {/* Top indicator */}
                  <View style={[styles.topIndicator, getTopIndicatorStyle(feature.color)]} />

                  {/* Icon */}
                  <View style={[styles.iconContainer, getFeatureIconContainerStyle(feature.color)]}>
                    {feature.iconElement}
                  </View>

                  {/* Title and description */}
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.solanaNavy,
    paddingVertical: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb1: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(153, 69, 255, 0.05)',
    ...(Platform.OS === 'web' ? {
      filter: 'blur(120px)',
    } : {}),
  },
  orb2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
    ...(Platform.OS === 'web' ? {
      filter: 'blur(120px)',
    } : {}),
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 64,
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.solanaDark,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: 24,
    shadowColor: `${Colors.solanaPurple}0D`,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.solanaPurple, 
    marginRight: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  headingLarge: {
    fontSize: 40,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: 640,
  },
  subheadingLarge: {
    fontSize: 18,
    lineHeight: 28,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -8,
  },
  featureCard: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  featureCardTablet: {
    width: '50%', 
  },
  featureCardPressed: {
    opacity: 0.9,
  },
  featureCardContent: {
    backgroundColor: Colors.solanaDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    padding: 24,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    width: 48,
    opacity: 0.4,
  },
  solanaIndicator: {
    backgroundColor: '#44b0ff', 
  },
  primaryIndicator: {
    backgroundColor: Colors.primary || '#9945FF',
  },
  secondaryIndicator: {
    backgroundColor: Colors.secondary || '#14F195',
  },
  defaultIndicator: {
    backgroundColor: '#888888',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  solanaIconContainer: {
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    borderColor: 'rgba(20, 241, 149, 0.2)',
  },
  firearmsIconContainer: {
    backgroundColor: `${Colors.primary}1A`, 
    borderColor: `${Colors.primary}33`, 
  },
  ammoIconContainer: {
    backgroundColor: `${Colors.secondary}1A`, 
    borderColor: `${Colors.secondary}33`, 
  },
  documentsIconContainer: {
    backgroundColor: 'rgba(68, 176, 255, 0.1)',
    borderColor: 'rgba(68, 176, 255, 0.2)',
  },
  securityIconContainer: {
    backgroundColor: `${Colors.secondary}1A`, 
    borderColor: `${Colors.secondary}33`, 
  },
  defaultIconContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    flex: 1,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: 12,
  },
  learnMoreText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  solanaText: {
    color: 'rgba(68, 176, 255, 0.8)', 
  },
  primaryText: {
    color: `${Colors.primary}CC`, 
  },
  secondaryText: {
    color: `${Colors.secondary}CC`, 
  },
  defaultText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default FeaturesSection;
