import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Import Feather
import { Button, Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import LogoSvg from '@/assets/images/logo.svg';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface LandingHeaderProps {
  scrolled?: boolean;
  onLogin?: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ scrolled = false, onLogin }) => {
  const router = useRouter();
  const { isTabletOrLarger, width } = useBreakpoint();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    
    // On web, we should manage overflow on body for when menu is open
    if (Platform.OS === 'web') {
      if (!mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    if (Platform.OS === 'web') {
      document.body.style.overflow = 'auto';
    }
  };

  // Navigation functions
  const navigateToCreateWallet = () => {
    closeMobileMenu();
    router.push('/onboarding');
  };

  const navigateToLogin = () => {
    closeMobileMenu();
    if (onLogin) {
      onLogin();
    }
    router.push('/login');
  };

  // Scroll to section (for web)
  const scrollToSection = (sectionId: string) => {
    closeMobileMenu();
    if (Platform.OS === 'web') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setActiveSection(sectionId);
  };

  // Update active section based on scroll position (web only)
  const updateActiveSection = () => {
    if (Platform.OS === 'web') {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionId = section.getAttribute('id');
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = (section as HTMLElement).offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight &&
          sectionId
        ) {
          setActiveSection(sectionId);
        }
      });

      // Set to home if at the top and no section is active
      if (scrollPosition < 100) {
        setActiveSection('home');
      }
    }
  };

  // Setup scroll listener for active section (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('scroll', updateActiveSection);
      updateActiveSection();
      
      return () => {
        window.removeEventListener('scroll', updateActiveSection);
      };
    }
  }, []);

  return (
    <View
      style={[
        styles.header,
        scrolled ? styles.headerScrolled : styles.headerTransparent,
        isTabletOrLarger ? styles.headerLarge : styles.headerSmall,
      ]}
    >
      <View style={[styles.container, isTabletOrLarger && styles.containerLarge]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {Platform.OS === 'web' ? (
            <LogoSvg width={isTabletOrLarger ? 120 : 100} height={isTabletOrLarger ? 40 : 32} />
          ) : (
            <Text style={styles.logoText}>TEAM556</Text>
          )}
        </View>

        {/* Desktop Navigation - only visible on larger screens */}
        {isTabletOrLarger && (
          <View style={styles.desktopNav}>
            <Pressable
              onPress={() => scrollToSection('features')}
              style={({ pressed }) => [
                styles.navLink,
                activeSection === 'features' && styles.activeNavLink,
                pressed && styles.pressedNavLink,
              ]}
            >
              <Text
                style={[
                  styles.navLinkText,
                  activeSection === 'features' && styles.activeNavLinkText,
                ]}
              >
                Features
              </Text>
            </Pressable>

            <Pressable
              onPress={() => scrollToSection('how-it-works')}
              style={({ pressed }) => [
                styles.navLink,
                activeSection === 'how-it-works' && styles.activeNavLink,
                pressed && styles.pressedNavLink,
              ]}
            >
              <Text
                style={[
                  styles.navLinkText,
                  activeSection === 'how-it-works' && styles.activeNavLinkText,
                ]}
              >
                How It Works
              </Text>
            </Pressable>

            <Pressable
              onPress={() => scrollToSection('testimonials')}
              style={({ pressed }) => [
                styles.navLink,
                activeSection === 'testimonials' && styles.activeNavLink,
                pressed && styles.pressedNavLink,
              ]}
            >
              <Text
                style={[
                  styles.navLinkText,
                  activeSection === 'testimonials' && styles.activeNavLinkText,
                ]}
              >
                Testimonials
              </Text>
            </Pressable>

            {/* CTA Buttons */}
            <View style={styles.ctaButtons}>
              <Button
                title="Login"
                variant="outline"
                style={styles.loginButton}
                onPress={navigateToLogin}
              />
              <Button
                title="Get Started"
                variant="primary"
                style={styles.getStartedButton}
                onPress={navigateToCreateWallet}
              />
            </View>
          </View>
        )}

        {/* Mobile menu toggle - only visible on mobile screens */}
        {!isTabletOrLarger && (
          <Pressable
            style={styles.mobileMenuButton}
            onPress={toggleMobileMenu}
          >
            <Feather name={mobileMenuOpen ? 'x' : 'menu'} size={20} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <View style={styles.mobileMenu}>
            <ScrollView style={styles.mobileMenuContent}>
              <Pressable
                style={[
                  styles.mobileNavItem,
                  activeSection === 'features' && styles.activeMobileNavItem,
                ]}
                onPress={() => scrollToSection('features')}
              >
                <View style={styles.mobileNavItemContent}>
                  <View style={styles.mobileNavItemDot} />
                  <Text style={styles.mobileNavItemText}>Features</Text>
                </View>
                <View style={styles.mobileNavItemArrow}>
                  {/* Arrow icon could be added here */}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.mobileNavItem,
                  activeSection === 'how-it-works' && styles.activeMobileNavItem,
                ]}
                onPress={() => scrollToSection('how-it-works')}
              >
                <View style={styles.mobileNavItemContent}>
                  <View style={styles.mobileNavItemDot} />
                  <Text style={styles.mobileNavItemText}>How It Works</Text>
                </View>
                <View style={styles.mobileNavItemArrow}>
                  {/* Arrow icon could be added here */}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.mobileNavItem,
                  activeSection === 'testimonials' && styles.activeMobileNavItem,
                ]}
                onPress={() => scrollToSection('testimonials')}
              >
                <View style={styles.mobileNavItemContent}>
                  <View style={styles.mobileNavItemDot} />
                  <Text style={styles.mobileNavItemText}>Testimonials</Text>
                </View>
                <View style={styles.mobileNavItemArrow}>
                  {/* Arrow icon could be added here */}
                </View>
              </Pressable>

              <View style={styles.mobileCTAContainer}>
                <Button
                  title="Login"
                  variant="outline"
                  size="large"
                  style={styles.mobileLoginButton}
                  onPress={navigateToLogin}
                />
                <Button
                  title="Get Started"
                  variant="primary"
                  size="large"
                  style={styles.mobileGetStartedButton}
                  onPress={navigateToCreateWallet}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  headerScrolled: {
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLarge: {
    paddingVertical: 20,
  },
  headerSmall: {
    paddingVertical: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  containerLarge: {
    paddingHorizontal: 48,
    maxWidth: 1280,
    marginHorizontal: 'auto',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeNavLink: {
    // Active state styling
  },
  activeNavLinkText: {
    color: Colors.text,
  },
  pressedNavLink: {
    opacity: 0.8,
  },
  ctaButtons: {
    flexDirection: 'row',
    marginLeft: 16,
    gap: 8,
  },
  loginButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
  },
  mobileMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mobileMenu: {
    position: 'absolute',
    top: 72, // Header height
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    zIndex: 40,
  },
  mobileMenuContent: {
    padding: 16,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeMobileNavItem: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderColor: `${Colors.primary}4D`, // 30% opacity
  },
  mobileNavItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileNavItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  mobileNavItemText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  mobileNavItemArrow: {
    // Arrow styling
  },
  mobileCTAContainer: {
    marginTop: 24,
    gap: 12,
  },
  mobileLoginButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  mobileGetStartedButton: {
    backgroundColor: Colors.primary,
  },
});

export default LandingHeader;
