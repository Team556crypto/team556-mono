import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  Animated, // Ensure this is from 'react-native'
  Easing,
  Image,
  Alert,
  Linking
} from 'react-native'
import { Text, useTheme, Button, Select } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { CreateAmmoPayload } from '@/services/api'
import { useAmmoStore } from '@/store/ammoStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Initial state for a new firearm
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Constants for calculating progress bar width
const DRAWER_HORIZONTAL_PADDING = 20 // From @team556/ui Drawer component's scrollContent
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20 // From local styles.headerGradient
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1 // From local styles.progressContainer

const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2

const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR // SCREEN_WIDTH - 40 - 40 - 2 = SCREEN_WIDTH - 82

// Define a type for the form state that allows Date objects and string inputs
type AmmoFormState = Omit<CreateAmmoPayload, 'purchaseDate' | 'purchasePrice' | 'quantity'> & {
  purchaseDate?: Date | string | undefined
  purchasePrice: string
  quantity: string
  pictures_base64?: string[]
}

const initialAmmoState: AmmoFormState = {
  manufacturer: '',
  caliber: '',
  type: '',
  grainWeight: '',
  quantity: '0',
  purchaseDate: undefined,
  purchasePrice: '',
  notes: '',
  pictures: undefined,
  pictures_base64: []
}

type Props = {}

export const AddAmmoDrawerContent: React.FC<Props> = () => {
  const { colors } = useTheme()
  const { addAmmo, isLoading } = useAmmoStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newAmmo, setNewAmmo] = useState<AmmoFormState>(initialAmmoState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AmmoFormState, string>> & { formError?: string }>({})

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 3],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH] // Use calculated numerical width
  })

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof AmmoFormState | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start()
  }, [currentStep])

  const handleInputChange = (field: keyof AmmoFormState, value: any) => {
    setNewAmmo(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate && datePickerField) {
      if (event.type === 'set') {
        // For Android, the date is set and we can hide the picker.
        // For iOS, the user has to confirm, so we just update the state.
        handleInputChange(datePickerField, selectedDate)
        if (Platform.OS !== 'ios') {
          setShowDatePicker(false)
        }
      }
    } else {
      // Handle case where no date is selected or picker is cancelled
      setShowDatePicker(false)
    }
  }

  const showMode = (fieldKey: keyof AmmoFormState) => {
    setDatePickerField(fieldKey)
    const fieldValue = newAmmo[fieldKey]
    if (fieldValue instanceof Date) {
      setCurrentDateValue(fieldValue)
    } else if (typeof fieldValue === 'string' && !isNaN(Date.parse(fieldValue))) {
      setCurrentDateValue(new Date(fieldValue))
    } else {
      setCurrentDateValue(new Date())
    }
    setShowDatePicker(true)
  }

  // Validation Functions
  const validateStep1 = () => {
    const errors: Partial<Record<keyof AmmoFormState, string>> = {}
    if (!newAmmo.manufacturer) errors.manufacturer = 'Manufacturer is required.'
    if (!newAmmo.caliber) errors.caliber = 'Caliber is required.'
    if (!newAmmo.type) errors.type = 'Type is required.'
    if (!newAmmo.grainWeight) errors.grainWeight = 'Grain weight is required.'
    if (!newAmmo.quantity || parseInt(newAmmo.quantity, 10) <= 0) {
      errors.quantity = 'Quantity must be a number greater than 0.'
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors: Partial<Record<keyof AmmoFormState, string>> = {}
    if (!newAmmo.purchaseDate) errors.purchaseDate = 'Purchase date is required.'
    if (newAmmo.purchasePrice && parseFloat(newAmmo.purchasePrice) < 0) {
      errors.purchasePrice = 'Purchase price cannot be negative.'
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    // No validation for notes and pictures, so always return true
    return true
  }

  const handleNextStep = () => {
    let isValid = false
    if (currentStep === 1) {
      isValid = validateStep1()
    } else if (currentStep === 2) {
      isValid = validateStep2()
    } else if (currentStep === 3) {
      isValid = validateStep3()
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveAmmo = async () => {
    setFieldErrors({})
    const isStep1Valid = validateStep1()
    const isStep2Valid = validateStep2()
    const isStep3Valid = validateStep3()

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      Alert.alert('Validation Error', 'Please correct the errors on all steps before saving.')
      if (!isStep1Valid) setCurrentStep(1)
      else if (!isStep2Valid) setCurrentStep(2)
      else if (!isStep3Valid) setCurrentStep(3)
      return
    }

    const ammoData: CreateAmmoPayload = {
      ...newAmmo,
      quantity: parseInt(newAmmo.quantity, 10),
      purchasePrice: newAmmo.purchasePrice ? parseFloat(newAmmo.purchasePrice) : undefined,
      purchaseDate: newAmmo.purchaseDate ? new Date(newAmmo.purchaseDate).toISOString() : undefined,
      pictures: newAmmo.pictures_base64 ? newAmmo.pictures_base64[0] : undefined,
    }

    try {
      await addAmmo(ammoData, token)
      closeDrawer()
      setNewAmmo(initialAmmoState) // Reset form
      setSelectedImageUri(null)
      setCurrentStep(1)
      setFieldErrors({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
      setFieldErrors({ formError: `Failed to save ammo: ${errorMessage}` })
    }
  }

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to let you pick an image. Please enable it in your settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        )
        return false
      }
    }
    return true
  }

  const pickImageAsync = async () => {
    const hasPermission = await requestMediaLibraryPermissions()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      setSelectedImageUri(asset.uri)
      if (asset.base64) {
        handleInputChange('pictures_base64', [`data:image/jpeg;base64,${asset.base64}`])
      }
    }
  }

  const styles = StyleSheet.create({
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
      // Kept for reference in existing code
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
      backgroundColor: colors.backgroundSubtle, // Changed from colors.backgroundOffset
      resizeMode: 'contain'
    },
    datePickerWeb: {
      // Add any specific wrapper styles for DatePicker on web if needed
      // For example, to ensure it aligns with other inputs
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

  const renderDatePicker = () => {
    if (!showDatePicker) return null

    if (Platform.OS === 'web') {
      return (
        <Modal
          transparent={true}
          animationType='fade'
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              <View style={styles.datePickerContainer}>
                <Text preset='h4' style={styles.datePickerTitle}>
                  Select Date
                </Text>
                <DatePicker
                  selected={currentDateValue}
                  onChange={date => {
                    if (datePickerField && date) {
                      handleInputChange(datePickerField, date)
                    }
                    setShowDatePicker(false)
                  }}
                  inline
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )
    }
    return (
      <DateTimePicker
        testID='dateTimePicker'
        value={currentDateValue}
        mode={'date'}
        is24Hour={true}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onDateChange}
      />
    )
  }

  const renderInput = (field: keyof AmmoFormState, placeholder: string, keyboardType: 'default' | 'numeric' = 'default') => (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{placeholder}</Text>
      <TextInput
        style={styles.inputStyle}
        value={newAmmo[field] as string}
        onChangeText={text => handleInputChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
      />
      {fieldErrors[field] && <Text style={styles.errorTextBelow}>{fieldErrors[field]}</Text>}
    </View>
  )

  const renderSelect = (field: keyof AmmoFormState, label: string, options: { label: string; value: string }[]) => (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <Select
        items={options}
        selectedValue={newAmmo[field] as string}
        onValueChange={value => handleInputChange(field, value)}
        placeholder={`Select ${label}...`}
      />
      {fieldErrors[field] && <Text style={styles.errorTextBelow}>{fieldErrors[field]}</Text>}
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="bullet" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Add New Ammunition</Text>
        <Text style={styles.subtitle}>Create a detailed record of your ammunition</Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
      </View>

      {currentStep === 1 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="target" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Primary Details</Text>
          </View>
          {renderInput('manufacturer', 'Manufacturer')}
          {renderInput('caliber', 'Caliber')}
          {renderInput('type', 'Type')}
          {renderInput('grainWeight', 'Grain Weight', 'numeric')}
          {renderInput('quantity', 'Quantity', 'numeric')}
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Purchase Information</Text>
          </View>
          <TouchableOpacity onPress={() => showMode('purchaseDate')} style={styles.inputRow}>
            <Text style={styles.label}>Purchase Date</Text>
            <View style={styles.inputStyle}>
              <Text style={styles.dateText}>
                {newAmmo.purchaseDate ? new Date(newAmmo.purchaseDate).toLocaleDateString() : 'Select a date'}
              </Text>
            </View>
          </TouchableOpacity>
          {fieldErrors.purchaseDate && <Text style={styles.errorTextBelow}>{fieldErrors.purchaseDate}</Text>}
          {renderInput('purchasePrice', 'Purchase Price', 'numeric')}
        </View>
      )}

      {currentStep === 3 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="image-multiple" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Photos & Notes</Text>
          </View>
          <TouchableOpacity onPress={pickImageAsync} style={styles.imagePicker}>
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imagePickerText}>Add Photo</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.notesInput}
            value={newAmmo.notes}
            onChangeText={text => handleInputChange('notes', text)}
            placeholder="Add notes..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
        </View>
      )}

      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <Button title="Back" onPress={handleBackStep} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        )}
        {currentStep < 3 ? (
          <Button title="Next" onPress={handleNextStep} variant="primary" style={{ flex: 1 }} />
        ) : (
          <Button title="Save Ammo" onPress={handleSaveAmmo} variant="primary" style={{ flex: 1 }} loading={isLoading} />
        )}
      </View>

      {renderDatePicker()}
    </ScrollView>
  )
}