import React, { useState } from 'react';
import { View, StyleSheet, Platform, Dimensions, Pressable, Image, Linking, TouchableOpacity } from 'react-native';
import { Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import LogoSvg from '@/assets/images/logo.svg';
import SolanaSvg from '@/assets/images/solana.svg';

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
        <View style={styles.topSection}>
          {/* CTA section */}
          <View style={styles.ctaSection}>
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
          <View style={styles.linksSection}>
            <View style={styles.mainLinksGroup}>
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
            <View style={styles.socialLinksGroup}>
              <Text style={styles.linksHeader}>Connect</Text>
              {socialLinks.map((social, index) => (
                <Pressable 
                  key={index} 
                  style={({ pressed }) => [
                    styles.linkItem,
                    pressed && styles.pressedItem
                  ]}
                  onPress={() => handleLinkPress(social.url)}
                >
                  <View style={styles.socialLinkContent}>
                    {social.iconComponent === 'Feather' && (
                      <Feather name={social.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    {social.iconComponent === 'FontAwesome' && (
                      <FontAwesome name={social.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    {social.iconComponent === 'MaterialCommunityIcons' && (
                      <MaterialCommunityIcons name={social.iconName as any} size={16} color={Colors.textSecondary} style={styles.socialIcon} />
                    )}
                    <Text style={styles.linkText}>{social.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            
            {/* Built on Solana */}
            <View style={styles.platformSection}>
              <Text style={styles.linksHeader}>Built on</Text>
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

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <Text style={styles.copyright}>
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

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: Colors.backgroundDarkest,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  contentContainer: {
    paddingHorizontal: 24,
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  topSection: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  ctaSection: {
    flex: isTablet ? 1 : undefined,
    marginRight: isTablet ? 40 : 0,
    marginBottom: isTablet ? 0 : 40,
    maxWidth: isTablet ? 320 : '100%',
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
    flex: isTablet ? 2 : undefined,
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  mainLinksGroup: {
    marginBottom: isDesktop ? 0 : 32,
    flex: isDesktop ? 1 : undefined,
  },
  socialLinksGroup: {
    marginBottom: isDesktop ? 0 : 32,
    flex: isDesktop ? 1 : undefined,
  },
  platformSection: {
    flex: isDesktop ? 1 : undefined,
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
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isTablet ? 'center' : 'center',
  },
  copyright: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: isTablet ? 0 : 16,
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
