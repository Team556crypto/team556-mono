import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions, ScrollView } from 'react-native';
import { Text } from '@repo/ui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// Define a type for the Expo icon component
type IconComponentType = typeof Feather | typeof Ionicons;

// Define the step item type
interface Step {
  id: number;
  title: string;
  description: string;
  iconElement: React.ReactNode; // Store the actual JSX element
  color: string;
}

const HowItWorksSection: React.FC = () => {
  // Define the steps with pre-built icon elements
  const steps: Step[] = [
    {
      id: 1,
      title: 'Create Your Secure Wallet',
      description:
        'Generate an advanced security encrypted wallet on the Solana blockchain with a simple setup process. Your keys, your control.',
      iconElement: <Ionicons name="wallet-outline" size={40} color={Colors.primary || '#9945FF'} />, 
      color: 'primary'
    },
    {
      id: 2,
      title: 'Add Your Collection',
      description:
        'Catalog firearms, ammunition, and accessories in your private Digital Armory. Track serial numbers, maintenance, and more—all encrypted and stored locally on your device.',
      iconElement: <Feather name="download-cloud" size={40} color={Colors.secondary || '#14F195'} />, 
      color: 'secondary'
    },
    {
      id: 3,
      title: 'Secure Your Documents',
      description:
        'Store licenses, certificates, and purchase records in your encrypted vault, accessible only by you. Nothing is shared or stored in the cloud.',
      iconElement: <Feather name="clipboard" size={40} color={Colors.primary || '#9945FF'} />, 
      color: 'primary'
    },
    {
      id: 4,
      title: 'Access Anywhere Securely',
      description:
        'Your data is available across all your devices, always encrypted and protected with biometric authentication.',
      iconElement: <Feather name="lock" size={40} color={Colors.secondary || '#14F195'} />, 
      color: 'secondary'
    }
  ];

  // Active step for mobile view
  const [activeStep, setActiveStep] = useState(1);

  // Get the icon container style for a step
  const getIconContainerStyle = (color: string) => {
    switch (color) {
      case 'primary':
        return styles.primaryIconContainer;
      case 'solana':
        return styles.solanaIconContainer;
      case 'secondary':
        return styles.secondaryIconContainer;
      default:
        return styles.defaultIconContainer;
    }
  };

  // Get the icon color for a step
  const getIconColor = (color: string) => {
    switch (color) {
      case 'primary':
        return Colors.primary || '#9945FF';
      case 'solana':
        return '#44b0ff'; // Solana blue
      case 'secondary':
        return Colors.secondary || '#14F195';
      default:
        return '#FFFFFF';
    }
  };

  // Get the indicator color for a step
  const getIndicatorColor = (color: string) => {
    switch (color) {
      case 'primary':
        return styles.primaryIndicator;
      case 'solana':
        return styles.solanaIndicator;
      case 'secondary':
        return styles.secondaryIndicator;
      default:
        return styles.defaultIndicator;
    }
  };

  // Handle step selection on mobile
  const handleStepChange = (stepId: number) => {
    setActiveStep(stepId);
  };

  return (
    <View style={styles.container} id="how-it-works">
      <View style={styles.decorativeTop} />
      <View style={styles.decorativeBottom} />

      <View style={styles.contentContainer}>
        {/* Section header */}
        <View style={styles.headerContainer}>
          {/* Decorative badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Simple & Intuitive</Text>
          </View>

          <Text style={styles.heading}>How Team556 Works</Text>

          <Text style={styles.subheading}>
            From setup to daily use, your journey with Team556 is straightforward, secure, and designed for an exceptional
            user experience
          </Text>
        </View>

        {/* Desktop Flow Diagram (only visible on large screens) */}
        {Platform.OS === 'web' && Dimensions.get('window').width >= 1024 && (
          <View style={styles.desktopFlowContainer}>
            {/* The connecting line would be implemented with a View that has a gradient background on web */}
            <View style={styles.connectionLine} />
            
            {/* Step circles with icons */}
            <View style={styles.stepsRow}>
              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepColumn}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumberText}>STEP {step.id.toString()}</Text>
                  </View>
                  
                  <View style={styles.iconOuterContainer}>
                    <View style={[styles.iconContainer, getIconContainerStyle(step.color)]}>
                      {/* Render the pre-built icon element */} 
                      {step.iconElement}
                    </View>
                    <View style={styles.iconGlow} />
                  </View>
                  
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mobile steps view (only on smaller screens) */}
        {(Platform.OS !== 'web' || Dimensions.get('window').width < 1024) && (
          <View style={styles.mobileContainer}>
            {/* Step selector */}
            <View style={styles.stepSelector}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${(activeStep / steps.length) * 100}%` }
                ]} 
              />
              
              {steps.map((step) => (
                <Pressable
                  key={step.id}
                  style={[
                    styles.stepButton,
                    activeStep === step.id && [styles.activeStepButton, getIndicatorColor(step.color)]
                  ]}
                  onPress={() => handleStepChange(step.id)}
                >
                  <Text style={[
                    styles.stepButtonNumber,
                    activeStep === step.id && styles.activeStepText
                  ]}>
                    {step.id.toString()}
                  </Text>
                  <Text style={[
                    styles.stepButtonLabel,
                    activeStep === step.id && styles.activeStepText
                  ]}>
                    {step.title.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Current step content */}
            {steps.map((step) => (
              activeStep === step.id && (
                <View key={`content-${step.id}`} style={styles.mobileStepContent}>
                  <View style={styles.mobileStepCard}>
                    <View style={styles.mobileStepHeader}>
                      <View style={[
                        styles.mobileIconContainer,
                        getIconContainerStyle(step.color)
                      ]}>
                        {/* Render the pre-built icon element */} 
                        {step.iconElement}
                      </View>
                      
                      <View>
                        <Text style={styles.mobileStepNumber}>
                          STEP {step.id.toString()}
                        </Text>
                        <Text style={styles.mobileStepTitle}>
                          {step.title}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.mobileStepDescription}>
                      {step.description}
                    </Text>
                  </View>
                  
                  {activeStep < steps.length && (
                    <Pressable
                      style={styles.nextButton}
                      onPress={() => setActiveStep(activeStep + 1)}
                    >
                      <Text style={styles.nextButtonText}>Next Step</Text>
                      <Feather name="chevron-right" size={16} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
              )
            ))}
          </View>
        )}

        {/* Security callout section */}
        <View style={styles.securitySection}>
          <View style={styles.securityCard}>
            <View style={styles.securityIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={32} color={Colors.primary || '#9945FF'} /> 
            </View>
            
            <Text style={styles.securityTitle}>End-to-End Encryption</Text>
            
            <Text style={styles.securityDescription}>
              Your data never leaves your device unencrypted. We use AES-256 encryption and zero-knowledge architecture to
              ensure your information remains private and secure, even from us.
            </Text>
            
            <View style={styles.badgesContainer}>
              <View style={styles.securityBadge}>
                <View style={[styles.badgeDot, styles.secondaryDot]} />
                <Text style={styles.badgeLabel}>NIST Compliant</Text>
              </View>
              
              <View style={styles.securityBadge}>
                <View style={[styles.badgeDot, styles.solanaDot]} />
                <Text style={styles.badgeLabel}>Zero-Knowledge</Text>
              </View>
              
              <View style={styles.securityBadge}>
                <View style={[styles.badgeDot, styles.primaryDot]} />
                <Text style={styles.badgeLabel}>Advanced Security</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeTop: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: `${Colors.primary}1A`, // 10% opacity
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, rgba(153, 69, 255, 0.1), rgba(68, 176, 255, 0.1), rgba(20, 241, 149, 0.1))',
      filter: 'blur(120px)',
    } : {}),
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: `${Colors.secondary}1A`, // 10% opacity
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, rgba(20, 241, 149, 0.1), rgba(68, 176, 255, 0.1), rgba(153, 69, 255, 0.1))',
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
    marginBottom: 60,
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#44b0ff', // Solana blue
    marginRight: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#44b0ff', // Solana blue
  },
  heading: {
    fontSize: isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, white, #e0e0e0, #d0d0d0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } : {}),
  },
  subheading: {
    fontSize: isTablet ? 18 : 16,
    lineHeight: isTablet ? 28 : 24,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: 640,
  },
  desktopFlowContainer: {
    width: '100%',
    maxWidth: 1280,
    marginHorizontal: 'auto',
    marginBottom: 80,
    paddingTop: 40,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    top: '58%',
    left: '5%',
    right: '5%',
    height: 3,
    backgroundColor: '#444',
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, rgba(153, 69, 255, 0.8), rgba(68, 176, 255, 0.8), rgba(20, 241, 149, 0.8), rgba(153, 69, 255, 0.8))',
      borderRadius: 2,
    } : {}),
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepNumberContainer: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  iconOuterContainer: {
    position: 'relative',
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryIconContainer: {
    backgroundColor: `${Colors.primary}33`, // 20% opacity
    borderColor: `${Colors.primary}66`, // 40% opacity
  },
  solanaIconContainer: {
    backgroundColor: 'rgba(68, 176, 255, 0.2)',
    borderColor: 'rgba(68, 176, 255, 0.4)',
  },
  secondaryIconContainer: {
    backgroundColor: `${Colors.secondary}33`, // 20% opacity
    borderColor: `${Colors.secondary}66`, // 40% opacity
  },
  defaultIconContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderColor: 'rgba(128, 128, 128, 0.4)',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    ...(Platform.OS === 'web' ? {
      filter: 'blur(20px)',
    } : {}),
    opacity: 0.6,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: '90%',
  },
  // Mobile styles
  mobileContainer: {
    width: '100%',
    maxWidth: 500,
    marginHorizontal: 'auto',
    marginBottom: 60,
  },
  stepSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
    borderRadius: 30,
    padding: 6,
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, rgba(153, 69, 255, 0.3), rgba(68, 176, 255, 0.3), rgba(20, 241, 149, 0.3))',
    } : {}),
  },
  stepButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1,
  },
  activeStepButton: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepButtonNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  stepButtonLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    display: isTablet ? 'flex' : 'none',
  },
  activeStepText: {
    color: Colors.text,
  },
  primaryIndicator: {
    backgroundColor: `${Colors.primary}33`, // 20% opacity
    ...(Platform.OS === 'web' ? {
      backgroundImage: `linear-gradient(90deg, ${Colors.primary}66, ${Colors.primary}33)`,
    } : {}),
  },
  solanaIndicator: {
    backgroundColor: 'rgba(68, 176, 255, 0.2)',
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(90deg, rgba(68, 176, 255, 0.4), rgba(68, 176, 255, 0.2))',
    } : {}),
  },
  secondaryIndicator: {
    backgroundColor: `${Colors.secondary}33`, // 20% opacity
    ...(Platform.OS === 'web' ? {
      backgroundImage: `linear-gradient(90deg, ${Colors.secondary}66, ${Colors.secondary}33)`,
    } : {}),
  },
  defaultIndicator: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  mobileStepContent: {
    position: 'relative',
  },
  mobileStepCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.6)',
    borderRadius: 16,
    borderWidth: 1, 
    borderColor: 'rgba(128, 128, 128, 0.3)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
    } : {}),
  },
  mobileStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mobileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mobileStepNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontWeight: '600',
  },
  mobileStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  mobileStepDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 64,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 24,
  },
  nextButtonText: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 4,
  },
  // Security section
  securitySection: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    marginTop: 60,
  },
  securityCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
      backgroundImage: 'linear-gradient(135deg, rgba(30, 30, 40, 0.6), rgba(20, 20, 30, 0.6))',
    } : {}),
  },
  securityIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}1A`, // 10% opacity
    borderWidth: 1,
    borderColor: `${Colors.primary}33`, // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  securityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  securityDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 600,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  badgeLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  primaryDot: {
    backgroundColor: Colors.primary || '#9945FF',
  },
  solanaDot: {
    backgroundColor: '#44b0ff', // Solana blue
  },
  secondaryDot: {
    backgroundColor: Colors.secondary || '#14F195',
  },
});

export default HowItWorksSection;
