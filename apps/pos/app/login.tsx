import React, { useRef, useEffect, useState } from 'react'
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Platform, ScrollView, SafeAreaView } from 'react-native'
import { Button, Text } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import Head from 'expo-router/head'

export default function POSLandingPage() {
  const router = useRouter()
  const { isTabletOrLarger, width: screenWidth } = useBreakpoint()
  const [isVisible, setIsVisible] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateAnim = useRef(new Animated.Value(20)).current

  // Trigger animations after component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)

      // Start animations
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
    }, 100)

    return () => clearTimeout(timer)
  }, [fadeAnim, translateAnim])

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: translateAnim
      }
    ]
  }

  const features = [
    {
      title: 'Payment Processing',
      description: 'Accept Team556 tokens, SOL, and traditional payments with instant blockchain settlement and zero chargebacks.',
      icon: <MaterialIcons name='payment' size={28} color={Colors.primary} />,
      color: Colors.primary
    },
    {
      title: 'Inventory Management',
      description: 'Track firearms, ammunition, and accessories with real-time stock updates and automated reorder alerts.',
      icon: <MaterialIcons name='inventory' size={28} color={Colors.secondary} />,
      color: Colors.secondary
    },
    {
      title: 'Compliance Tools',
      description: 'Built-in ATF compliance features including 4473 forms, background checks, and audit trail reporting.',
      icon: <MaterialIcons name='verified' size={28} color={Colors.success} />,
      color: Colors.success
    },
    {
      title: 'Customer Management',
      description: 'Maintain customer profiles, purchase history, and loyalty programs with privacy-focused data handling.',
      icon: <Ionicons name='people' size={28} color={Colors.warning} />,
      color: Colors.warning
    },
    {
      title: 'Analytics Dashboard',
      description: 'Real-time sales analytics, inventory turnover reports, and business intelligence insights.',
      icon: <Ionicons name='analytics' size={28} color={Colors.primary} />,
      color: Colors.primary
    },
    {
      title: 'Secure Transactions',
      description: 'End-to-end encrypted transactions with blockchain security and zero-knowledge architecture.',
      icon: <Feather name='shield' size={28} color={Colors.secondary} />,
      color: Colors.secondary
    }
  ]

  const stats = [
    { label: 'Active Retailers', value: '2,500+', icon: 'storefront', color: Colors.primary },
    { label: 'Daily Transactions', value: '50K+', icon: 'trending-up', color: Colors.secondary },
    { label: 'System Uptime', value: '99.9%', icon: 'checkmark-circle', color: Colors.success },
    { label: 'Avg Settlement', value: '<1min', icon: 'time', color: Colors.warning }
  ]

  const testimonials = [
    {
      quote: "Team556 POS transformed our store operations. The compliance tools alone saved us hundreds of hours.",
      author: "Mike Chen",
      role: "Owner, Liberty Arms",
      rating: 5
    },
    {
      quote: "The blockchain payments are revolutionary. No more chargebacks and instant settlements.",
      author: "Sarah Martinez",
      role: "Manager, Defender Supply",
      rating: 5
    },
    {
      quote: "Best POS system we've used. The inventory management is incredibly intuitive and powerful.",
      author: "Robert Thompson",
      role: "Owner, Patriot Firearms",
      rating: 5
    }
  ]

  const renderHeroSection = () => (
    <View style={[styles.heroSection, isTabletOrLarger && styles.heroSectionTablet]}>
      <Head>
        <title>Team556 POS - Modern Point of Sale for Firearms Retailers</title>
        <meta name="description" content="The complete POS solution built specifically for the firearms industry. Accept crypto payments, manage inventory, and maintain compliance." />
      </Head>
      
      {/* Status Badge */}
      <Animated.View style={[styles.statusBadge, animatedStyle]}>
        <View style={styles.statusBadgeInner}>
          <View style={styles.badgeGradientOverlay} />
          <View style={styles.badgeContent}>
            <View style={styles.liveDotContainer}>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.badgeText}>
              Industry Leading • Compliant • Blockchain Secured
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Heading */}
      <Animated.View style={[styles.headingContainer, animatedStyle]}>
        <Text style={[styles.heading, isTabletOrLarger && styles.headingTablet]}>
          Modern Point of Sale for
        </Text>
        <Text style={[styles.heading, isTabletOrLarger && styles.headingTablet, styles.headingHighlight]}>
          Firearms Retailers
        </Text>
        <Text style={[styles.subheading, isTabletOrLarger && styles.subheadingTablet]}>
          The complete POS solution built specifically for the firearms industry. Accept Team556 tokens, 
          SOL, and traditional payments while maintaining full compliance and protecting customer privacy.
        </Text>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <Button
          title='Start Free Trial'
          variant='primary'
          size='large'
          leftIcon={<Feather name='play' color='white' size={18} />}
          style={styles.primaryButton}
          onPress={() => router.push('/signup')}
        />
        <Button
          title='Schedule Demo'
          variant='outline'
          size='large'
          leftIcon={<Feather name='calendar' color={Colors.primary} size={18} />}
          style={styles.outlineButton}
          onPress={() => {}}
        />
        <TouchableOpacity 
          style={styles.signinLink}
          onPress={() => router.push('/signin')}
        >
          <Text style={styles.signinText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats */}
      <Animated.View style={[styles.statsContainer, animatedStyle]}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Ionicons 
              name={stat.icon as any} 
              size={24} 
              color={stat.color} 
              style={styles.statIcon} 
            />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  )

  const renderFeaturesSection = () => (
    <View style={styles.featuresSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <Text style={styles.sectionBadgeText}>Purpose-Built Solution</Text>
        </View>
        <Text style={[styles.sectionHeading, isTabletOrLarger && styles.sectionHeadingTablet]}>
          Everything You Need
        </Text>
        <Text style={[styles.sectionSubheading, isTabletOrLarger && styles.sectionSubheadingTablet]}>
          Complete POS solution with compliance, security, and modern payment processing built-in.
        </Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <View key={index} style={[styles.featureCard, isTabletOrLarger && styles.featureCardTablet]}>
            <View style={styles.featureCardContent}>
              <View style={[styles.topIndicator, { backgroundColor: feature.color }]} />
              
              <View style={[styles.iconContainer, { 
                backgroundColor: `${feature.color}15`, 
                borderColor: `${feature.color}30` 
              }]}>
                {feature.icon}
              </View>
              
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  const renderTestimonialsSection = () => (
    <View style={styles.testimonialsSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <Text style={styles.sectionBadgeText}>Trusted by Retailers</Text>
        </View>
        <Text style={[styles.sectionHeading, isTabletOrLarger && styles.sectionHeadingTablet]}>
          What Our Customers Say
        </Text>
      </View>

      <View style={styles.testimonialsGrid}>
        {testimonials.map((testimonial, index) => (
          <View key={index} style={styles.testimonialCard}>
            <View style={styles.starsContainer}>
              {[...Array(testimonial.rating)].map((_, i) => (
                <Ionicons key={i} name='star' size={16} color={Colors.warning} />
              ))}
            </View>
            <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
            <View style={styles.testimonialAuthor}>
              <Text style={styles.authorName}>{testimonial.author}</Text>
              <Text style={styles.authorRole}>{testimonial.role}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  const renderCTASection = () => (
    <View style={styles.ctaSection}>
      <View style={styles.ctaContent}>
        <MaterialIcons name='point-of-sale' size={48} color={Colors.primary} style={styles.ctaIcon} />
        <Text style={[styles.ctaTitle, isTabletOrLarger && styles.ctaTitleTablet]}>
          Ready to Modernize Your Store?
        </Text>
        <Text style={[styles.ctaDescription, isTabletOrLarger && styles.ctaDescriptionTablet]}>
          Join thousands of firearms retailers who trust Team556 POS for their daily operations. 
          Start your free trial today and see the difference.
        </Text>
        <View style={styles.ctaButtons}>
          <Button
            title='Start Free Trial'
            variant='primary'
            size='large'
            leftIcon={<Feather name='play' color='white' size={18} />}
            style={styles.primaryButton}
            onPress={() => router.push('/signup')}
          />
          <View style={styles.ctaSecondaryActions}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/signin')}
            >
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
            <Text style={styles.ctaSeparator}>•</Text>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Schedule Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeroSection()}
        {renderFeaturesSection()}
        {renderTestimonialsSection()}
        {renderCTASection()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Team556 POS • Built for the firearms industry • Secure • Compliant • Modern
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarkest
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: width < 768 ? Dimensions.get('window').height * 0.8 : Dimensions.get('window').height
  },
  heroSectionTablet: {
    paddingVertical: 80,
    paddingHorizontal: 40
  },
  statusBadge: {
    marginBottom: 32,
    overflow: 'hidden',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  statusBadgeInner: {
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 16,
    position: 'relative'
  },
  badgeGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    backgroundColor: Colors.primary,
    borderRadius: 30
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  liveDotContainer: {
    width: 10,
    height: 10,
    marginRight: 12,
    position: 'relative'
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text
  },
  headingContainer: {
    marginBottom: 40,
    alignItems: 'center',
    maxWidth: 800
  },
  heading: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 50
  },
  headingTablet: {
    fontSize: 56,
    lineHeight: 64
  },
  headingHighlight: {
    color: Colors.primary,
    marginBottom: 24
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 640
  },
  subheadingTablet: {
    fontSize: 20,
    lineHeight: 32
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 48,
    width: '100%',
    maxWidth: 400
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary + '60',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
    width: '100%'
  },
  outlineButton: {
    borderColor: Colors.primary,
    borderWidth: 2,
    width: '100%'
  },
  signinLink: {
    marginTop: 8
  },
  signinText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 600
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  statIcon: {
    marginBottom: 12
  },
  statValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500'
  },
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: Colors.background
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 64,
    maxWidth: 800,
    marginHorizontal: 'auto'
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 10
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text
  },
  sectionHeading: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  sectionHeadingTablet: {
    fontSize: 44
  },
  sectionSubheading: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 640
  },
  sectionSubheadingTablet: {
    fontSize: 20,
    lineHeight: 32
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -12
  },
  featureCard: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  featureCardTablet: {
    width: '50%'
  },
  featureCardContent: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 28,
    height: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    width: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary
  },
  testimonialsSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundDarkest
  },
  testimonialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -12
  },
  testimonialCard: {
    width: width < 768 ? '100%' : '33.33%',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'center'
  },
  testimonialQuote: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  testimonialAuthor: {
    alignItems: 'center'
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4
  },
  authorRole: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    alignItems: 'center'
  },
  ctaContent: {
    maxWidth: 600,
    alignItems: 'center'
  },
  ctaIcon: {
    marginBottom: 24
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  ctaTitleTablet: {
    fontSize: 40
  },
  ctaDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40
  },
  ctaDescriptionTablet: {
    fontSize: 20,
    lineHeight: 32
  },
  ctaButtons: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: 320
  },
  ctaSecondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  ctaSeparator: {
    color: Colors.textSecondary,
    fontSize: 16
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600'
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundDarkest,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8
  }
})
