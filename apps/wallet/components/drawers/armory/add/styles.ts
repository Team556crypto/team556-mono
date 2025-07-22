import { StyleSheet } from 'react-native'
import { Platform } from 'react-native'

export const armoryStyles = (colors: any, SCREEN_WIDTH: any) => {
    return StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 26
    },
    contentContainer: {
      paddingBottom: 100
    },
    header: {
      alignItems: 'center',
      paddingVertical: 20
    },
    headerIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.primary
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center'
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
      paddingHorizontal: 20
    },
    headerContainer: {
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20
    },
    headerGradient: {
      width: '100%',
      padding: 20
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20
    },
    progressContainer: {
      height: 12,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginVertical: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.backgroundLight,
      position: 'relative',
      padding: 1
    },
    progressBar: {
      height: 10, // Explicit numerical height
      backgroundColor: colors.primary,
      borderRadius: 6
    },
    progressSteps: {
      position: 'absolute',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      paddingHorizontal: 0,
      alignItems: 'center',
      left: 0,
      top: 0
    },
    progressStep: {
      width: 10,
      height: 10,
      borderRadius: 5,
      opacity: 0.9,
      zIndex: 10
    },
    progressStepActive: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary
    },
    progressStepInactive: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: colors.backgroundLight
    },
    stepsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
      paddingHorizontal: 16
    },
    stepButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primarySubtle
    },
    activeStepButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    stepButtonText: {
      fontSize: 14,
      color: colors.textSecondary
    },
    activeStepButtonText: {
      color: colors.background,
      fontWeight: 'bold'
    },
    sectionWrapper: {
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.primarySubtle,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12
    },
    section: {
      marginBottom: 20,
      paddingHorizontal: 16
    },
    sectionTitleInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8
    },
    sectionContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    detailRowContainer: {
      marginBottom: 12
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6
    },
    detailRowLast: {
    },
    detailLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      flex: 1,
      marginRight: 8,
      fontWeight: '500'
    },
    inputContainer: {
      flex: 2
    },
    inputRow: {
      marginBottom: 15
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500'
    },
    inputStyle: {
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.backgroundSubtle,
      minHeight: 40,
      fontWeight: '500'
    },
    selectInRowStyle: {},
    dateText: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      color: colors.text,
      minHeight: 40,
      height: 40,
      textAlignVertical: 'center'
    },
    dateContainer: {
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      borderRadius: 8,
      backgroundColor: colors.backgroundSubtle,
      height: 40,
      justifyContent: 'center'
    },
    placeholderText: {
      color: colors.textTertiary
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.error}20`,
      padding: 12,
      borderRadius: 8,
      marginVertical: 16
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginLeft: 8,
      flex: 1
    },
    errorTextBelow: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
      textAlign: 'left'
    },
    stepButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 30 : 20,
      gap: 14 // 14px gap between buttons
    },
    buttonHalfWidth: {
      flex: 1 // Use flex instead of fixed width to ensure proper layout
    },
    buttonContainer: {
      marginTop: 24,
      marginBottom: 24,
      paddingHorizontal: 16,
      alignItems: 'center'
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    },
    datePickerContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.primary,
      width: SCREEN_WIDTH * 0.9,
      maxWidth: 380,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 16,
      textAlign: 'center'
    },
    datePickerContent: {
      marginVertical: 8,
      borderRadius: 8,
      overflow: 'hidden',
      width: '100%'
    },
    datePickerActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      width: '100%'
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 10,
      backgroundColor: colors.backgroundSubtle,
      resizeMode: 'contain'
    },
    datePickerWeb: {
      width: '100%'
    },
    imagePicker: {
      height: 150,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primarySubtle
    },
    imagePickerText: {
      color: colors.textSecondary
    },
    notesInput: {
      backgroundColor: colors.background,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      minHeight: 100,
      textAlignVertical: 'top'
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 30
    },
  })
}