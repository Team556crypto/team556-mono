import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors'; // Assuming named export

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.backgroundDarker, 
  },
  contentContainer: {
    padding: 20,
  },
  overviewCard: {
    backgroundColor: Colors.backgroundDark, 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border, 
  },
  overviewTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16, 
  },
  overviewItemContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, 
  },
  overviewIcon: { 
    marginRight: 12,
    color: Colors.primary, 
  },
  overviewTextContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
  },
  overviewRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overviewLabel: {
    color: Colors.textSecondary,
    fontSize: 16, 
  },
  overviewValue: {
    color: Colors.text,
    fontSize: 16, 
    fontWeight: 'bold', 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  optionCard: {
    backgroundColor: Colors.backgroundDark, 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border, 
  },
  selectedOptionCard: {
    borderColor: Colors.primary, 
    borderWidth: 2,
    backgroundColor: Colors.primary + '1A', 
  },
  optionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionName: {
    color: Colors.text,
    fontSize: 18, 
    fontWeight: 'bold',
    flex: 1, 
  },
  optionIconWrapper: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: Colors.primary + '26', 
    borderRadius: 20, 
  },
  optionCardBody: {
  },
  optionDetailRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  optionDetailLabel: { 
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionDetailValue: { 
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  apyText: { 
    color: Colors.success, 
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8, 
    marginBottom: 12, 
  },
  stakeActionSection: {
    marginTop: 20,
    backgroundColor: Colors.backgroundDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.backgroundDarker,
    color: Colors.text,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  balanceText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  button: {
    marginTop: 8,
  },
  positionCard: {
    backgroundColor: Colors.backgroundDark, 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border, 
  },
  positionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionName: {
    color: Colors.text,
    fontSize: 18, 
    fontWeight: 'bold',
    flex: 1, 
  },
  positionIconWrapper: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: Colors.success + '26', 
    borderRadius: 20, 
  },
  centeredMessage: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
    marginBottom: 20,
  },
});
