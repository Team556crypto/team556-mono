import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

// These styles are intended for AssetDetails components.
// They are temporarily placed here due to directory creation issues.
export const assetDetailsStyles = StyleSheet.create({
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
    marginBottom: 16,
  },
  drawerTitle: {
    marginLeft: 12,
    fontSize: 20, 
    fontWeight: 'bold',
    color: Colors.text,
  },
  drawerInfoSection: {
    marginBottom: 24,
  },
  drawerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSubtle,
  },
  drawerLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  drawerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
});
