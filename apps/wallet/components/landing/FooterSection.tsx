import React from 'react';
import { View, StyleSheet, Platform, Dimensions, Pressable, Image, Linking } from 'react-native';
import { Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons'; // Import Feather icons
import { useTheme } from '@react-navigation/native';
import LogoSvg from '@/assets/images/logo.svg';

// Define the type for social links with correctly typed icon names
interface SocialLink {
  icon: React.ComponentProps<typeof Feather>['name']; // Explicitly type icon name
  href: string;
}

const FooterSection: React.FC = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  // Links for the footer
  const footerLinks = [
    { text: 'Privacy Policy', href: '#' },
    { text: 'Terms of Service', href: '#' },
    { text: 'Contact', href: '#' },
    { text: 'Support', href: '#' }
  ];

  // Social media links with typed icon names
  const socialLinks: SocialLink[] = [
    { icon: 'twitter', href: 'https://twitter.com/team556' },
    { icon: 'github', href: 'https://github.com/team556' },
    { icon: 'users', href: 'https://team556.com/community' },
  ];

  // Handle link press
  const handleLinkPress = (href: string) => {
    if (Platform.OS === 'web') {
      window.open(href, '_blank');
    } else {
      Linking.openURL(href);
    }
    // For native, we would implement navigation to another screen
  };

  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Top section with logo and links */}
        <View style={styles.topSection}>
          {/* Logo and tagline */}
          <View style={styles.logoSection}>
            {Platform.OS === 'web' ? (
              <LogoSvg width={160} height={40} style={styles.logo} />
            ) : (
              <Image 
                source={require('@/assets/images/logo.svg')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            )}
            <Text style={styles.tagline}>
              Secure Firearms Management on Solana
            </Text>
          </View>

          {/* Links */}
          <View style={styles.linksContainer}>
            {footerLinks.map((link, index) => (
              <Pressable 
                key={index} 
                style={({ pressed }) => [
                  styles.linkItem,
                  pressed && styles.linkItemPressed
                ]}
                onPress={() => handleLinkPress(link.href)}
              >
                <Text style={styles.linkText}>{link.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom section with social links and copyright */}
        <View style={styles.bottomSection}>
          {/* Social media icons */}
          <View style={styles.socialContainer}>
            {socialLinks.map((social, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed
                ]}
                onPress={() => handleLinkPress(social.href)}
              >
                <Feather name={social.icon} size={20} color={colors.text} />
              </Pressable>
            ))}
          </View>

          {/* Copyright */}
          <Text style={styles.copyright}>
            &copy; {currentYear.toString()} Team556. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: Colors.backgroundDark,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
    } : {}),
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  topSection: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoSection: {
    alignItems: isTablet ? 'flex-start' : 'center',
    marginBottom: isTablet ? 0 : 24,
  },
  logo: {
    height: 40,
    width: 160,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  linkItem: {
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
  linkItemPressed: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...(Platform.OS === 'web' ? {
      textDecoration: 'none',
    } : {}),
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
    alignItems: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
  socialButtonPressed: {
    backgroundColor: Colors.backgroundSubtle,
    transform: [{ scale: 0.95 }],
  },
  copyright: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

export default FooterSection;
