import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface HowItWorksSectionProps {
  // Add any props if needed
}

const steps = [
  {
    icon: 'shield',
    title: 'Create Your Account',
    description: 'Quickly set up your secure digital vault with military-grade encryption.'
  },
  {
    icon: 'key',
    title: 'Secure Your Assets',
    description: 'Add firearms, documents, and digital assets with blockchain protection.'
  },
  {
    icon: 'smartphone',
    title: 'Access Anywhere',
    description: 'Manage your inventory securely from any device with your credentials.'
  },
  {
    icon: 'refresh',
    title: 'Stay Up-to-Date',
    description: 'Get real-time updates and alerts for your digital and physical assets.'
  }
];

const HowItWorksSection: React.FC<HowItWorksSectionProps> = () => {
  const { isTabletOrLarger } = useBreakpoint();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How It Works</Text>
        <Text style={styles.subtitle}>
          Our platform provides a seamless way to secure and manage your assets
        </Text>
      </View>

      {/* Steps for Mobile */}
      {!isTabletOrLarger && (
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepIconContainer}>
                <Feather name={step.icon as any} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Desktop Flow Diagram (only visible on large screens) */}
      {Platform.OS === 'web' && Dimensions.get('window').width >= 1024 && (
        <View style={styles.desktopFlowContainer}>
          {/* Step circles with icons */}
          <View style={styles.stepsRow}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepCircle}>
                <View style={styles.innerCircle}>
                  <Feather name={step.icon as any} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.circleTitle}>{step.title}</Text>
                <Text style={styles.circleDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tablet view (in between mobile and desktop) */}
      {isTabletOrLarger && Platform.OS !== 'web' && (
        <View style={styles.tabletStepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.tabletStepCard}>
              <View style={styles.tabletStepIconContainer}>
                <Feather name={step.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.tabletStepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    width: '100%'
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    textAlign: 'center' as any
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    maxWidth: 600,
    textAlign: 'center',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 16
  },
  stepsContainer: {
    flexDirection: 'column' as const,
    gap: 20,
    alignItems: 'center',
    width: '100%'
  },
  stepCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    textAlign: 'center' as any
  },
  stepIconContainer: {
    backgroundColor: Colors.primarySubtle,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  // Tablet-specific styles
  tabletStepsContainer: {
    flexDirection: 'column' as const,
    gap: 20,
    width: '100%'
  },
  tabletStepCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    flexDirection: 'row' as const,
    alignItems: 'center'
  },
  tabletStepIconContainer: {
    backgroundColor: Colors.primarySubtle,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  tabletStepContent: {
    flex: 1
  },
  // Desktop flow diagram styles
  desktopFlowContainer: {
    marginTop: 40,
    alignItems: 'center',
    position: 'relative'
  },
  stepsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 30
  },
  stepCircle: {
    alignItems: 'center',
    width: '22%',
    position: 'relative'
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  circleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  circleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  connectionLine: {
    position: 'absolute',
    top: 35,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: Colors.primarySubtle,
    zIndex: -1
  }
});

export default HowItWorksSection;