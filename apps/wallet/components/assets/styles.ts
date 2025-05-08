import { StyleSheet, Dimensions, Platform } from 'react-native'
import { Colors } from '@/constants/Colors'

const { width } = Dimensions.get('window')

// These styles are intended for AssetDetails components.
// They are temporarily placed here due to directory creation issues.
export const assetDetailsStyles = StyleSheet.create({
  drawerContentContainer: {
    // padding: 24,
    backgroundColor: Colors.backgroundDark
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
    marginBottom: 20
  },
  drawerTitle: {
    marginLeft: 16,
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text
  },
  drawerInfoSection: {
    // marginBottom: 28,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 16,
    // padding: 16,
    paddingBottom: 8
  },
  drawerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  drawerLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500'
  },
  drawerValue: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text
  },
  lastDetailRow: {
    borderBottomWidth: 0
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 16,
    marginRight: 2
  },
  drawerActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 8,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 16,
    padding: 16
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.backgroundSubtle,
    marginVertical: 20,
    width: '100%'
  },
  drawerCloseButton: {
    paddingVertical: 16,
    marginHorizontal: 8,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  closeButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  infoContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  valueAmount: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center'
  },
  priceContainer: {
    backgroundColor: Colors.backgroundSubtle,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'center'
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500'
  }
})
