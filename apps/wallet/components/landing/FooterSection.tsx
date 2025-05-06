import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Image, Linking, TouchableOpacity } from 'react-native';
import { Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import LogoSvg from '@/assets/images/logo.svg';
import SolanaSvg from '@/assets/images/solana.svg';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Define types
interface NavLink {
  text: string;
  href: string;
}

interface SocialLink {
  name: string;
  iconComponent: 'Feather' | 'FontAwesome' | 'MaterialCommunityIcons';
  iconName: string;
  url: string;
}

const FooterSection: React.FC = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  const [copied, setCopied] = useState(false);
  const tokenAddress = "AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5";
  const { isTabletOrLarger } = useBreakpoint();

  // Main links
  const mainLinks: NavLink[] = [
    { text: 'Wallet', href: '#wallet' },
    { text: 'Digital Armory', href: '#digital-armory' },
    { text: 'Security', href: '#security' },
    { text: 'FAQs', href: '#faqs' },
  ];

  // Legal links
  const legalLinks: NavLink[] = [
    { text: 'Terms', href: '/terms' },
    { text: 'Privacy', href: '/privacy' },
    { text: 'Compliance', href: '/compliance' },
  ];

  // Social media links
  const socialLinks: SocialLink[] = [
    {
      name: 'Twitter',
      iconComponent: 'Feather',
      iconName: 'twitter',
      url: 'https://x.com/team556_coin',
    },
    {
      name: 'Facebook',
      iconComponent: 'FontAwesome',
      iconName: 'facebook',
      url: 'https://www.facebook.com/profile.php?id=61573136584832',
    },
    {
      name: 'Instagram',
      iconComponent: 'FontAwesome',
      iconName: 'instagram',
      url: 'https://www.instagram.com/team556_official/',
    },
  ];

  // Handle link press
  const handleLinkPress = (href: string) => {
    if (Platform.OS === 'web') {
      window.open(href, '_blank');
    } else {
      Linking.openURL(href);
    }
  };

  // Handle copying token address
  const copyTokenAddress = () => {
    // Copy the token address to clipboard
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(tokenAddress);
    } else {
      // For React Native, we would use Clipboard.setString, but it's not needed for this web app
    }
    
    // Show copied feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Top section with CTA and links */}
        <View style={[styles.topSection, isTabletOrLarger ? styles.topSectionLarge : {}]}>
          {/* CTA section */}
          <View style={[styles.ctaSection, isTabletOrLarger ? styles.ctaSectionLarge : {}]}>
            <View style={styles.logoContainer}>
              {Platform.OS === 'web' ? (
                <LogoSvg width={36} height={36} />
              ) : (
                <Image 
                  source={require('@/assets/images/logo.svg')} 
                  style={{ width: 36, height: 36 }} 
                  resizeMode="contain" 
                />
              )}
              <Text style={styles.logoText}>Team556</Text>
            </View>
            
            <Text style={styles.ctaText}>
              Take control of your digital assets and firearm records with blockchain security and local encryption.
            </Text>
          </View>

          {/* Main links section */}
          <View style={[styles.linksSection, isTabletOrLarger ? styles.linksSectionLarge : {}]}>
            {/* Navigation links */}
            <View style={[styles.mainLinksGroup, isTabletOrLarger ? styles.linksGroupLarge : {}]}>
              <Text style={styles.linksHeader}>Navigation</Text>
              {mainLinks.map((link, index) => (
                <Pressable 
                  key={index} 
                  style={({ pressed }) => [
                    styles.linkItem,
                    pressed && styles.pressedItem
                  ]}
                  onPress={() => handleLinkPress(link.href)}
                >
                  <Text style={styles.linkText}>{link.text}</Text>
                </Pressable>
              ))}
            </View>

            {/* Social links */}
            <View style={[styles.socialLinksGroup, isTabletOrLarger ? styles.linksGroupLarge : {}]}>
              <Text style={styles.linksHeader}>Community</Text>
              {socialLinks.map((link, index) => (
                <Pressable 
                  key={index} 
                  style={({ pressed }) => [
                    styles.linkItem,
                    pressed && styles.pressedItem
                  ]}
                  onPress={() => handleLinkPress(link.url)}
                >
                  <View style={styles.socialLinkContent}>
                    {link.iconComponent === 'Feather' && (
                      <Feather name={link.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    {link.iconComponent === 'FontAwesome' && (
                      <FontAwesome name={link.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    {link.iconComponent === 'MaterialCommunityIcons' && (
                      <MaterialCommunityIcons name={link.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    <Text style={styles.linkText}>{link.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Platform/Token links */}
            <View style={[styles.platformSection, isTabletOrLarger ? styles.linksGroupLarge : {}]}>
              <Text style={styles.linksHeader}>Platform</Text>
              <View style={styles.solanaContainer}>
                {Platform.OS === 'web' ? (
                  <SolanaSvg width={100} height={24} />
                ) : (
                  <Image 
                    source={require('@/assets/images/solana.svg')} 
                    style={{ width: 100, height: 24 }} 
                    resizeMode="contain" 
                  />
                )}
              </View>
              
              <View style={styles.tokenInfo}>
                <View style={styles.tokenHeader}>
                  <Text style={styles.tokenLabel}>Team556 Token</Text>
                  <TouchableOpacity 
                    onPress={copyTokenAddress}
                    style={styles.copyButton}
                  >
                    <Feather 
                      name={copied ? "check" : "copy"} 
                      size={14} 
                      color={copied ? Colors.secondary : Colors.textSecondary} 
                    />
                    <Text style={[styles.copyText, copied && styles.copiedText]}>
                      {copied ? "Copied" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.tokenAddress}>
                  {tokenAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom section with copyright and legal links */}
        <View style={[styles.bottomSection, isTabletOrLarger ? styles.bottomSectionLarge : {}]}>
          <Text style={[styles.copyright, isTabletOrLarger ? styles.copyrightLeft : styles.copyrightCentered]}>
            &copy; {currentYear.toString()} Team556. All rights reserved.
          </Text>
          
          <View style={styles.legalLinks}>
            {legalLinks.map((link, index) => (
              <React.Fragment key={index}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.legalLinkItem,
                    pressed && styles.pressedItem
                  ]}
                  onPress={() => handleLinkPress(link.href)}
                >
                  <Text style={styles.legalLinkText}>{link.text}</Text>
                </Pressable>
                {index < legalLinks.length - 1 && <View style={styles.legalDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: Colors.backgroundDarkest,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 'auto',
  },
  contentContainer: {
    paddingHorizontal: 24,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  topSection: {
    flexDirection: 'column',
    marginBottom: 60,
  },
  topSectionLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ctaSection: {
    marginBottom: 40,
  },
  ctaSectionLarge: {
    flex: 1,
    marginRight: 40,
    marginBottom: 0,
    maxWidth: 320,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  ctaText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  linksSection: {
    flexDirection: 'column',
  },
  linksSectionLarge: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainLinksGroup: {
    marginBottom: 32,
  },
  socialLinksGroup: {
    marginBottom: 32,
  },
  platformSection: {
  },
  linksGroupLarge: {
    flex: 1,
    marginBottom: 0,
  },
  linksHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkItem: {
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
  pressedItem: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  socialLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialIcon: {
    marginRight: 8,
  },
  solanaContainer: {
    marginBottom: 16,
  },
  tokenInfo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(153, 69, 255, 0.06)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  copiedText: {
    color: Colors.secondary,
  },
  tokenAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : 'Consolas',
    letterSpacing: -0.2,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 24,
    flexDirection: 'column',
    alignItems: 'center',
  },
  bottomSectionLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  copyrightCentered: {
    marginBottom: 16,
    textAlign: 'center',
  },
  copyrightLeft: {
    marginBottom: 0,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLinkItem: {
    paddingHorizontal: 8,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
  legalLinkText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  legalDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default FooterSection;
