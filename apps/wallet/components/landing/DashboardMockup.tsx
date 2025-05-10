import React from 'react'
import { View, StyleSheet, Platform, Image } from 'react-native'
import { Text } from '@repo/ui'
import { Colors } from '@/constants/Colors'
import { Feather } from '@expo/vector-icons'
import LogoSvg from '@/assets/images/logo.svg'
import SolanaSvg from '@/assets/images/solana.svg'

const DashboardMockup: React.FC = () => {
  return (
    <View style={styles.mockupContainer}>
      <View style={styles.mockupsRow}>
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
              </View>
            </View>

            {/* Portfolio Value Section */}
            <View style={styles.portfolioSection}>
              <Text style={styles.portfolioLabel}>Portfolio Value</Text>
              <Text style={styles.portfolioValue}>$1,245.80</Text>
              <View style={styles.portfolioChange}>
                <Feather name='arrow-up-right' size={14} color={Colors.success} />
                <Text style={styles.portfolioChangeText}>2.4% today</Text>
              </View>
            </View>

            {/* Token List Section */}
            <View style={styles.tokenListContainer}>
              <View style={styles.tokenListHeader}>
                <Text style={styles.tokenListTitle}>Your Assets</Text>
                <Feather name='plus-circle' size={18} color={Colors.textSecondary} />
              </View>

              {/* SOL Token Card */}
              <View style={styles.tokenCard}>
                <View style={styles.tokenIconContainer}>
                  {Platform.OS === 'web' ? (
                    <SolanaSvg width={28} height={28} />
                  ) : (
                    <Image source={require('@/assets/images/solana.svg')} style={{ width: 28, height: 28 }} />
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
                    <Image source={require('@/assets/images/logo.svg')} style={{ width: 28, height: 28 }} />
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
              <View style={styles.activityCard}>
                <View style={styles.activityIconContainer}>
                  {Platform.OS === 'web' ? (
                    <SolanaSvg width={20} height={20} />
                  ) : (
                    <Image source={require('@/assets/images/solana.svg')} style={{ width: 20, height: 20 }} />
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
              <View style={styles.activityCard}>
                <View style={[styles.activityIconContainer, styles.team556ActivityIconContainer]}>
                  {Platform.OS === 'web' ? (
                    <LogoSvg width={20} height={20} />
                  ) : (
                    <Image source={require('@/assets/images/logo.svg')} style={{ width: 20, height: 20 }} />
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mockupContainer: {
    width: '100%',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  mockupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    maxWidth: 800,
    ...(Platform.OS === 'web'
      ? {
          perspective: '2000px'
        }
      : {})
  },
  desktopMockup: {
    width: 480,
    height: 700,
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 15,
    zIndex: 1
  },
  browserControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle || '#333'
  },
  browserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6
  },
  browserTitle: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12,
    marginLeft: 10
  },
  dashboardContent: {
    flex: 1,
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 20
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 20
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  profileInfo: {},
  profileName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: 'bold'
  },
  portfolioSection: {
    marginBottom: 24
  },
  portfolioLabel: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 14
  },
  portfolioValue: {
    color: Colors.text || '#ECEDEE',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  portfolioChangeText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 4
  },
  tokenListContainer: {
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24
  },
  tokenListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  tokenListTitle: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '600'
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  team556IconContainer: {
    backgroundColor: 'rgba(153, 69, 255, 0.1)'
  },
  tokenInfo: {
    flex: 1
  },
  tokenName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '500'
  },
  tokenTicker: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12
  },
  tokenValue: {
    alignItems: 'flex-end'
  },
  tokenAmount: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '500'
  },
  tokenPrice: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12
  },
  activityContainer: {
    backgroundColor: Colors.backgroundDarker || '#151515',
    borderRadius: 16,
    padding: 16
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  activityTitle: {
    color: Colors.text || '#ECEDEE',
    fontSize: 16,
    fontWeight: '600'
  },
  viewAllText: {
    color: Colors.secondary || '#14F195',
    fontSize: 12
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  team556ActivityIconContainer: {
    backgroundColor: 'rgba(153, 69, 255, 0.1)'
  },
  activityInfo: {
    flex: 1
  },
  activityName: {
    color: Colors.text || '#ECEDEE',
    fontSize: 14,
    fontWeight: '500'
  },
  activityTime: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12
  },
  activityAmount: {
    alignItems: 'flex-end'
  },
  activityAmountText: {
    color: Colors.text || '#ECEDEE',
    fontSize: 14,
    fontWeight: '500'
  },
  activityAmountValue: {
    color: Colors.textSecondary || '#9BA1A6',
    fontSize: 12
  },
  // Mobile mockup styles
  mobileMockup: {
    width: 265,
    height: 540,
    backgroundColor: 'transparent',
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 15, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 25,
    position: 'relative',
    marginLeft: -120,
    marginTop: 60,
    zIndex: 2,
    ...(Platform.OS === 'web'
      ? {
          transform: 'rotateY(-22deg) rotateX(6deg) translateX(0px)'
        }
      : {})
  },
  ar15ContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden'
  },
  ar15Content: {
    width: '100%',
    height: '100%'
  }
})

export default DashboardMockup
