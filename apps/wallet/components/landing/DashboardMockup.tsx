import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { Text } from '@repo/ui';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import LogoSvg from '@/assets/images/logo.svg';
import SolanaSvg from '@/assets/images/solana.svg';

const DashboardMockup: React.FC = () => {
  return (
    <View style={styles.mockupContainer}>
      {/* Desktop Dashboard */}
      <View style={styles.desktopMockup}>
        {/* Browser Window Controls */}
        <View style={styles.browserControls}>
          <View style={[styles.browserDot, { backgroundColor: '#FF5F56' }]} />
          <View style={[styles.browserDot, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.browserDot, { backgroundColor: '#27C93F' }]} />
          <Text style={styles.browserTitle}>Team556 Dashboard</Text>
        </View>

        {/* Dashboard Content */}
        <View style={styles.dashboardContent}>
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>JS</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Joe's Safe</Text>
              <Text style={styles.profileTier}>Premium Tier • 2 Years</Text>
            </View>
          </View>

          {/* Portfolio Value Section */}
          <View style={styles.portfolioSection}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>$1,245.80</Text>
            <View style={styles.portfolioChange}>
              <Feather name="arrow-up-right" size={14} color={Colors.success} />
              <Text style={styles.portfolioChangeText}>2.4% today</Text>
            </View>
          </View>

          {/* Token List Section */}
          <View style={styles.tokenListContainer}>
            <View style={styles.tokenListHeader}>
              <Text style={styles.tokenListTitle}>Your Assets</Text>
              <Feather name="plus-circle" size={18} color={Colors.textSecondary} />
            </View>

            {/* SOL Token Card */}
            <View style={styles.tokenCard}>
              <View style={styles.tokenIconContainer}>
                {Platform.OS === 'web' ? (
                  <SolanaSvg width={28} height={28} />
                ) : (
                  <Image 
                    source={require('@/assets/images/solana.svg')} 
                    style={{ width: 28, height: 28 }} 
                  />
                )}
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>Solana</Text>
                <Text style={styles.tokenTicker}>SOL</Text>
              </View>
              <View style={styles.tokenValue}>
                <Text style={styles.tokenAmount}>2.45</Text>
                <Text style={styles.tokenPrice}>$136.42</Text>
              </View>
            </View>

            {/* Team556 Token Card */}
            <View style={styles.tokenCard}>
              <View style={[styles.tokenIconContainer, styles.team556IconContainer]}>
                {Platform.OS === 'web' ? (
                  <LogoSvg width={28} height={28} />
                ) : (
                  <Image 
                    source={require('@/assets/images/logo.svg')} 
                    style={{ width: 28, height: 28 }} 
                  />
                )}
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>Team556</Text>
                <Text style={styles.tokenTicker}>T556</Text>
              </View>
              <View style={styles.tokenValue}>
                <Text style={styles.tokenAmount}>556.00</Text>
                <Text style={styles.tokenPrice}>$0.72</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.activityContainer}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            
            {/* SOL Transaction */}
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                {Platform.OS === 'web' ? (
                  <SolanaSvg width={20} height={20} />
                ) : (
                  <Image 
                    source={require('@/assets/images/solana.svg')} 
                    style={{ width: 20, height: 20 }} 
                  />
                )}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>Received SOL</Text>
                <Text style={styles.activityTime}>12m ago</Text>
              </View>
              <View style={styles.activityAmount}>
                <Text style={styles.activityAmountText}>+0.5 SOL</Text>
                <Text style={styles.activityAmountValue}>$68.21</Text>
              </View>
            </View>
            
            {/* Team556 Transaction */}
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, styles.team556IconContainer]}>
                {Platform.OS === 'web' ? (
                  <LogoSvg width={20} height={20} />
                ) : (
                  <Image 
                    source={require('@/assets/images/logo.svg')} 
                    style={{ width: 20, height: 20 }} 
                  />
                )}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>Purchased Team556</Text>
                <Text style={styles.activityTime}>2h ago</Text>
              </View>
              <View style={styles.activityAmount}>
                <Text style={styles.activityAmountText}>+100 T556</Text>
                <Text style={styles.activityAmountValue}>$72.00</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Mobile Mockup */}
      <View style={styles.mobileMockup}>
        <View style={styles.mobileHeader}>
          <View style={styles.mobileStatusBar}>
            <Text style={styles.mobileTime}>9:41</Text>
            <View style={styles.mobileStatusIcons}>
              <View style={styles.mobileSignalDot} />
              <View style={styles.mobileSignalDot} />
              <View style={styles.mobileSignalDot} />
              <View style={styles.mobileSignalDot} />
              <Feather name="wifi" size={12} color="#fff" />
              <Feather name="battery" size={14} color="#fff" />
            </View>
          </View>
        </View>
        
        <View style={styles.mobileContent}>
          {/* Mobile header with Digital Armory title */}
          <View style={styles.mobileAppHeader}>
            {Platform.OS === 'web' ? (
              <LogoSvg width={20} height={20} />
            ) : (
              <Image 
                source={require('@/assets/images/logo.svg')} 
                style={{ width: 20, height: 20 }} 
              />
            )}
            <Text style={styles.mobileAppTitle}>Digital Armory</Text>
          </View>
          
          {/* Firearm Inventory Card - Glock 19 */}
          <View style={styles.firearmCard}>
            <View style={styles.firearmCardHeader}>
              <Text style={styles.firearmName}>Glock 19 Gen 5</Text>
              <Text style={styles.firearmPrice}>$600</Text>
            </View>
            
            <View style={styles.firearmCardContent}>
              <View style={styles.firearmCardLeftColumn}>
                <View style={styles.firearmTag}>
                  <Text style={styles.firearmTagText}>Pistol</Text>
                </View>
                
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>MANUFACTURER/MODEL</Text>
                  <Text style={styles.firearmDetailValue}>G19 Gen 5</Text>
                </View>
                
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>CALIBER</Text>
                  <Text style={styles.firearmDetailValue}>9mm</Text>
                </View>
                
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>PURCHASE DATE</Text>
                  <Text style={styles.firearmDetailValue}>2023-05-15</Text>
                </View>
                
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>LAST CLEANED</Text>
                  <Text style={styles.firearmDetailValue}>09/05/2023</Text>
                </View>
              </View>
              
              <View style={styles.firearmCardRightColumn}>
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>SERIAL NUMBER</Text>
                  <Text style={styles.firearmDetailValue}>BFGX123</Text>
                </View>
                
                <View style={styles.firearmDetailGroup}>
                  <Text style={styles.firearmDetailLabel}>ROUND COUNT</Text>
                  <Text style={styles.firearmDetailValue}>1250</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.firearmCardActions}>
              <View style={styles.firearmActionButton}>
                <Text style={styles.firearmActionText}>Accessories</Text>
              </View>
              <View style={[styles.firearmActionButton, styles.editButton]}>
                <Text style={styles.firearmActionText}>Edit</Text>
              </View>
              <View style={[styles.firearmActionButton, styles.sellButton]}>
                <Text style={styles.firearmActionText}>Sell</Text>
              </View>
              <View style={[styles.firearmActionButton, styles.deleteButton]}>
                <Text style={styles.firearmActionText}>Delete</Text>
              </View>
            </View>
          </View>
          
          {/* Firearm Inventory Card - Sig Sauer */}
          <View style={styles.firearmCard}>
            <View style={styles.firearmCardHeader}>
              <Text style={styles.firearmName}>Sig Sauer P365</Text>
              <Text style={styles.firearmPrice}>$550</Text>
            </View>
            
            <View style={styles.firearmCardContent}>
              <View style={styles.firearmTag}>
                <Text style={styles.firearmTagText}>Pistol</Text>
              </View>
            </View>
          </View>
          
          {/* Partially visible - AR-15 card */}
          <View style={[styles.firearmCard, styles.partialCard]}>
            <View style={styles.firearmCardHeader}>
              <Text style={styles.firearmName}>AR-15</Text>
              <Text style={styles.firearmPrice}>$1,900</Text>
            </View>
          </View>
          
        </View>
        
        <View style={styles.mobileNav}>
          <View style={styles.mobileNavItem}>
            <Feather name="grid" size={20} color={Colors.primary} />
            <Text style={[styles.mobileNavText, styles.mobileNavActive]}>Armory</Text>
          </View>
          <View style={styles.mobileNavItem}>
            <Feather name="plus-circle" size={20} color={Colors.textSecondary} />
            <Text style={styles.mobileNavText}>Add</Text>
          </View>
          <View style={styles.mobileNavItem}>
            <Feather name="settings" size={20} color={Colors.textSecondary} />
            <Text style={styles.mobileNavText}>Settings</Text>
          </View>
        </View>
        
        <View style={styles.mobileHomeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mockupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      perspective: '1000px',
    } : {}),
  },
  desktopMockup: {
    width: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundDark || '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginRight: Platform.OS === 'web' ? -20 : -10,
    ...(Platform.OS === 'web' ? {
      transform: 'rotateY(-10deg)',
    } : {}),
    zIndex: 1,
  },
  browserControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle || '#333',
  },
  browserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  browserTitle: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
    marginLeft: 10,
  },
  dashboardContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary || '#9945FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileInfo: {},
  profileName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileTier: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
  },
  portfolioSection: {
    marginBottom: 24,
  },
  portfolioLabel: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 14,
  },
  portfolioValue: {
    color: Colors.text || '#ECEDEE',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioChangeText: {
    color: Colors.success || '#4caf50',
    fontSize: 14,
    marginLeft: 4,
  },
  tokenListContainer: {
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tokenListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenListTitle: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 241, 149, 0.1)', // Solana green with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  team556IconContainer: {
    backgroundColor: 'rgba(153, 69, 255, 0.1)', // Team556 purple with opacity
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '500',
  },
  tokenTicker: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
  },
  tokenValue: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '500',
  },
  tokenPrice: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
  },
  activityContainer: {
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderRadius: 16,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    color: Colors.secondary || '#14F195',
    fontSize: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 241, 149, 0.1)', // Solana green with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    color: Colors.success || '#4caf50',
    fontSize: 14,
    fontWeight: '500',
  },
  activityAmountValue: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
  },
  mobileMockup: {
    width: 240,
    height: 470,
    borderRadius: 36,
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
    position: 'relative',
    borderWidth: 10,
    borderColor: '#111',
    zIndex: 0,
    ...(Platform.OS === 'web' ? {
      transform: 'rotateY(5deg)',
    } : {}),
  },
  mobileHeader: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  mobileStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  mobileTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  mobileStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mobileSignalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  mobileContent: {
    flex: 1,
    backgroundColor: Colors.background || '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
    paddingTop: 16,
  },
  mobileAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  mobileAppTitle: {
    color: Colors.text || '#ECEDEE',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  firearmCard: {
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  partialCard: {
    marginTop: -4,
    opacity: 0.6,
    height: 42,
    overflow: 'hidden',
  },
  firearmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  firearmName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  firearmPrice: {
    color: Colors.primary || '#9945FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  firearmCardContent: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  firearmCardLeftColumn: {
    flex: 1.2,
    marginRight: 8,
  },
  firearmCardRightColumn: {
    flex: 1,
  },
  firearmTag: {
    backgroundColor: Colors.primarySubtle || 'rgba(174, 108, 254, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  firearmTagCompact: {
    backgroundColor: Colors.primarySubtle || 'rgba(174, 108, 254, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  firearmTagText: {
    color: Colors.text || '#ECEDEE',
    fontSize: 12,
    fontWeight: '500',
  },
  firearmDetailGroup: {
    marginBottom: 5,
  },
  firearmDetailLabel: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 9,
    marginBottom: 2,
  },
  firearmDetailValue: {
    color: Colors.text || '#ECEDEE',
    fontSize: 11,
  },
  firearmCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  firearmActionButton: {
    backgroundColor: Colors.backgroundDark || '#1E1E1E',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  editButton: {
    backgroundColor: Colors.backgroundDark || '#1E1E1E',
  },
  sellButton: {
    backgroundColor: '#255F2A',
  },
  deleteButton: {
    backgroundColor: '#5A2828',
  },
  firearmActionText: {
    color: Colors.text || '#ECEDEE',
    fontSize: 10,
    fontWeight: '500',
  },
  mobileNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundDark || '#121212',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  mobileNavItem: {
    alignItems: 'center',
  },
  mobileNavText: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 10,
    marginTop: 4,
  },
  mobileNavActive: {
    color: Colors.primary || '#9945FF',
  },
  mobileHomeIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
});

export default DashboardMockup;
