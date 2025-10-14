import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, Alert, Platform, TextInput } from 'react-native';
import { Button, Text, useTheme, Input } from '@team556/ui';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { NotificationSettingsPanel } from '@/components/settings/NotificationSettingsPanel';
import { DistributorSettingsPanel } from '@/components/settings/DistributorSettingsPanel';
import { SecuritySettingsPanel } from '@/components/settings/SecuritySettingsPanel';
import { WalletAddressSettings } from '@/components/wallet/WalletAddressSettings';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export default function Settings() {
  const { colors } = useTheme();
  const { isTabletOrLarger } = useBreakpoint();
  const { logout, user, isLoading } = useAuthStore();
  
  // Active section state
  const [activeSection, setActiveSection] = useState('account');
  
  // Form state for business details
  const [businessName, setBusinessName] = useState('Team556 Merchant');
  const [email, setEmail] = useState('contact@team556.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [timezone, setTimezone] = useState('Pacific Time (UTC-8)');
  
  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [printReceipts, setPrintReceipts] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(false);
  const [taxCalculation, setTaxCalculation] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSaveChanges = () => {
    Alert.alert('Success', 'Changes saved successfully!');
  };

  const handleSetDefault = (walletName: string) => {
    Alert.alert('Set Default Wallet', `Set ${walletName} as your default wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Set Default', onPress: () => Alert.alert('Success', `${walletName} is now your default wallet`) }
    ]);
  };

  const handleDisconnectWallet = (walletName: string) => {
    Alert.alert('Disconnect Wallet', `Are you sure you want to disconnect ${walletName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => Alert.alert('Disconnected', `${walletName} has been disconnected`) }
    ]);
  };

  const handleAddWallet = () => {
    Alert.alert('Add Wallet', 'Connect a new wallet to your account.');
  };

  const handleViewDashboard = () => {
    Alert.alert('View Dashboard', 'Navigate to wallet dashboard.');
  };

  const sidebarItems = [
    { id: 'account', title: 'Account', icon: 'person', active: true },
    { id: 'wallet', title: 'Wallet', icon: 'wallet', active: false },
    { id: 'distributors', title: 'Distributors', icon: 'business', active: false },
    { id: 'notifications', title: 'Notifications', icon: 'notifications', active: false },
    { id: 'security', title: 'Security', icon: 'shield-checkmark', active: false }
  ];

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>Settings</Text>
      <Text style={styles.sidebarSubtitle}>Manage your account and preferences</Text>
      
      <View style={styles.sidebarMenu}>
        {sidebarItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.sidebarItem,
              activeSection === item.id && styles.sidebarItemActive
            ]}
            onPress={() => setActiveSection(item.id)}
          >
            <Ionicons 
              name={item.icon as any} 
              size={20} 
              color={activeSection === item.id ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.sidebarItemText,
              activeSection === item.id && styles.sidebarItemTextActive
            ]}>
              {item.title}
            </Text>
            {activeSection === item.id && (
              <Ionicons name='chevron-forward' size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>View our documentation{"\n"}or contact support for assistance.</Text>
        <TouchableOpacity style={styles.docButton}>
          <Ionicons name='document-text' size={16} color={Colors.text} />
          <Text style={styles.docButtonText}>View Documentation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>Account Information</Text>
        <View style={styles.activeSection}>
          <Text style={styles.activeSectionText}>Active Section: account</Text>
        </View>
      </View>

      <View style={styles.accountInfo}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>T</Text>
            </View>
            <TouchableOpacity style={styles.uploadButton}>
              <Ionicons name='cloud-upload' size={16} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.merchantName}>Team556 Merchant</Text>
            <Text style={styles.merchantEmail}>{user?.email || 'contact@team556.com'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name='business' size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Business Details</Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Business Name*</Text>
          <TextInput
            style={styles.formInput}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Enter business name"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={styles.formHelper}>Your business name will be displayed on invoices and receipts</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email Address*</Text>
          <TextInput
            style={styles.formInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
          />
          <Text style={styles.formHelper}>We'll use this address to contact you about your account</Text>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name='call' size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Contact Information</Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Phone</Text>
          <TextInput
            style={styles.formInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="phone-pad"
          />
          <Text style={styles.formHelper}>Used for account verification and security alerts</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Timezone</Text>
          <TouchableOpacity style={styles.selectInput}>
            <Text style={styles.selectInputText}>{timezone}</Text>
            <Ionicons name='chevron-down' size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Ionicons name='save' size={16} color={Colors.text} style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWalletSection = () => (
    <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
        <View style={styles.contentHeaderLeft}>
          <Ionicons name='wallet' size={20} color={Colors.primary} style={styles.contentIcon} />
          <Text style={styles.contentTitle}>Payment Wallet Addresses</Text>
        </View>
        <View style={styles.contentHeaderRight}>
          <View style={styles.activeSection}>
            <Text style={styles.activeSectionText}>Active Section: wallet</Text>
          </View>
        </View>
      </View>

      {/* Address management section */}
      <WalletAddressSettings />
    </View>
  );

  const renderDistributorsSection = () => (
    <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>Distributors</Text>
        <View style={styles.activeSection}>
          <Text style={styles.activeSectionText}>Active Section: distributors</Text>
        </View>
      </View>
      <DistributorSettingsPanel />
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>Notification Preferences</Text>
        <View style={styles.activeSection}>
          <Text style={styles.activeSectionText}>Active Section: notifications</Text>
        </View>
      </View>
      <NotificationSettingsPanel />
    </View>
  );

  const renderOtherSection = () => (
    <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>{sidebarItems.find(item => item.id === activeSection)?.title}</Text>
        <View style={styles.activeSection}>
          <Text style={styles.activeSectionText}>Active Section: {activeSection}</Text>
        </View>
      </View>
      
      <View style={styles.placeholderContent}>
        <Ionicons 
          name={sidebarItems.find(item => item.id === activeSection)?.icon as any} 
          size={48} 
          color={Colors.primary} 
        />
        <Text style={styles.placeholderTitle}>{sidebarItems.find(item => item.id === activeSection)?.title} Settings</Text>
        <Text style={styles.placeholderText}>This section would contain the {activeSection} settings and configurations.</Text>
        
        {activeSection === 'security' && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name='log-out' size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title='Settings'
      headerIcon={<Ionicons name='settings' size={24} color={colors.primary} />}
      scrollEnabled={false}
    >
      <View style={styles.container}>
        {renderSidebar()}
        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
          {activeSection === 'account' && renderAccountSection()}
          {activeSection === 'wallet' && renderWalletSection()}
          {activeSection === 'distributors' && renderDistributorsSection()}
          {activeSection === 'notifications' && renderNotificationsSection()}
          {activeSection === 'security' && (
            <View style={styles.mainContent}>
              <View style={styles.contentHeader}>
                <Text style={styles.contentTitle}>Security</Text>
                <View style={styles.activeSection}>
                  <Text style={styles.activeSectionText}>Active Section: security</Text>
                </View>
              </View>
              <SecuritySettingsPanel />
            </View>
          )}
          {activeSection !== 'account' && activeSection !== 'wallet' && activeSection !== 'distributors' && activeSection !== 'notifications' && activeSection !== 'security' && renderOtherSection()}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    width: 280,
    backgroundColor: Colors.backgroundDark,
    borderRightWidth: 1,
    borderRightColor: Colors.backgroundLight,
    padding: 24
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32
  },
  sidebarMenu: {
    marginBottom: 40
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12
  },
  sidebarItemActive: {
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`
  },
  sidebarItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1
  },
  sidebarItemTextActive: {
    color: Colors.primary
  },
  helpSection: {
    marginTop: 'auto'
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8
  },
  helpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16
  },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 6,
    gap: 8
  },
  docButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text
  },
  contentArea: {
    flex: 1
  },
  mainContent: {
    padding: 24
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32
  },
  contentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  contentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  contentIcon: {
    marginRight: 4
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text
  },
  activeSection: {
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  activeSectionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500'
  },
  accountInfo: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    gap: 6
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary
  },
  profileInfo: {
    flex: 1
  },
  merchantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4
  },
  merchantEmail: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  formSection: {
    marginBottom: 32
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  },
  formGroup: {
    marginBottom: 24
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8
  },
  formInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8
  },
  formHelper: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16
  },
  selectInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectInputText: {
    fontSize: 16,
    color: Colors.text
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    gap: 8
  },
  saveIcon: {
    marginRight: 4
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 400
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 8,
    gap: 8,
    marginTop: 24
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletStats: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    gap: 20
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text
  },
  viewDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    gap: 6
  },
  viewDashboardText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary
  },
  walletsContainer: {
    gap: 16
  },
  walletCard: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 20
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetails: {
    flex: 1
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text
  },
  walletAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 6
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary
  },
  setDefaultButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6
  },
  setDefaultButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 6,
    gap: 4
  },
  disconnectButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.error
  }
});
