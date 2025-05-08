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
  Animated,
  Easing
} from 'react-native'
import { Text, useTheme, Button, Select } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Firearm } from '@/services/api'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'

// Define a local payload type for creating firearms, as it's not in api.ts
// This should ideally come from @/services/api if a create endpoint exists
export interface CreateFirearmPayload {
  name: string
  type: string
  serial_number: string
  manufacturer?: string
  model_name?: string
  caliber?: string
  acquisition_date_raw?: Date | string
  purchase_price?: string
  ballistic_performance?: string
  image_raw?: string
  round_count_raw?: number
  value_raw?: number
  status_raw?: string
  last_fired?: Date | string
  last_cleaned?: Date | string
}

// Initial state for a new firearm
const { width: SCREEN_WIDTH } = Dimensions.get('window')

const initialFirearmState: CreateFirearmPayload = {
  name: '',
  type: '',
  serial_number: '',
  manufacturer: '',
  model_name: '',
  caliber: '',
  acquisition_date_raw: undefined,
  purchase_price: '',
  ballistic_performance: '',
  image_raw: '',
  round_count_raw: 0,
  value_raw: 0.0,
  status_raw: '',
  last_fired: undefined,
  last_cleaned: undefined
}

export const AddFirearmDrawerContent = () => {
  const { colors } = useTheme()
  const { addFirearm, isLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newFirearm, setNewFirearm] = useState<CreateFirearmPayload>(initialFirearmState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateFirearmPayload, string>>>({})

  const steps = ['Primary Details', 'Acquisition & Value', 'Usage & Maintenance', 'Additional Info']

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof CreateFirearmPayload | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  const handleInputChange = (field: keyof CreateFirearmPayload, value: any) => {
    setNewFirearm((prev: CreateFirearmPayload) => ({ ...prev, [field]: value }))
  }

  // Specific handler for date changes from the picker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('AddFirearmDrawerContent: onDateChange event:', event.type, 'selectedDate:', selectedDate)
    setShowDatePicker(false) // Hide picker on any action
    if (event.type === 'set' && selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate.toISOString())
    }
    setDatePickerField(null) // Reset the field being edited
  }

  const showMode = (fieldKey: keyof CreateFirearmPayload) => {
    console.log('AddFirearmDrawerContent: showMode called for field:', fieldKey)
    const fieldValue = newFirearm[fieldKey]
    // Ensure currentDateValue is a valid Date, defaulting to now if current value is not valid
    const initialPickerDate =
      fieldValue instanceof Date
        ? fieldValue
        : typeof fieldValue === 'string' && !isNaN(new Date(fieldValue).getTime())
          ? new Date(fieldValue)
          : new Date()

    console.log('AddFirearmDrawerContent: Initial picker date:', initialPickerDate)
    setCurrentDateValue(initialPickerDate)
    setDatePickerField(fieldKey)
    setShowDatePicker(true)
    console.log('AddFirearmDrawerContent: showDatePicker set to true')
  }

  const validateStep1 = () => {
    const { name, type, serial_number, manufacturer, model_name, caliber } = newFirearm
    const errors: Partial<Record<keyof CreateFirearmPayload, string>> = {}

    if (!name) errors.name = 'Required'
    if (!type) errors.type = 'Required'
    if (!serial_number) errors.serial_number = 'Required'
    if (!manufacturer) errors.manufacturer = 'Required'
    if (!model_name) errors.model_name = 'Required'
    if (!caliber) errors.caliber = 'Required'

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Clear previous Step 1 errors before re-validating
      setFieldErrors(prev => ({
        ...prev,
        name: undefined,
        type: undefined,
        serial_number: undefined,
        manufacturer: undefined,
        model_name: undefined,
        caliber: undefined
      }))
      if (!validateStep1()) {
        return
      }
    }
    setCurrentStep(currentStep + 1)
  }

  const handleSaveFirearm = async () => {
    // Ensure all step 1 fields are validated again before final save, in case user navigated back and forth
    const isStep1Valid = validateStep1()
    if (currentStep === 1 && !isStep1Valid) {
      // If on step 1 and validation fails, stop here. Errors are already set by validateStep1.
      return
    }
    if (currentStep !== 1 && !isStep1Valid) {
      // If not on step 1, but step 1 is invalid, navigate to step 1 and show errors.
      setCurrentStep(1)
      return
    }

    // Step 4 validation
    let imageError = false
    if (!newFirearm.image_raw) {
      setFieldErrors(prev => ({ ...prev, image_raw: 'Required' }))
      imageError = true
    } else {
      setFieldErrors(prev => ({ ...prev, image_raw: undefined }))
    }

    if (imageError) {
      setCurrentStep(4) // Navigate back to step 4 if image is missing
      return
    }

    // Fallback for critical fields - though step 1 validation should cover this
    if (!newFirearm.name || !newFirearm.type || !newFirearm.serial_number) {
      // This condition should ideally not be met if step 1 validation is comprehensive
      // and navigation to further steps is blocked correctly.
      // We can set general errors if specific field errors aren't already set by validateStep1.
      if (!fieldErrors.name && !fieldErrors.type && !fieldErrors.serial_number) {
        setFieldErrors(prev => ({
          ...prev,
          name: !newFirearm.name ? 'Required' : undefined,
          type: !newFirearm.type ? 'Required' : undefined,
          serial_number: !newFirearm.serial_number ? 'Required' : undefined
        }))
      }
      // Determine if we need to navigate back to step 1
      if (!newFirearm.name || !newFirearm.type || !newFirearm.serial_number) {
        setCurrentStep(1)
        return
      }
    }

    const roundCount = newFirearm.round_count_raw ? parseInt(String(newFirearm.round_count_raw), 10) : 0
    const value = newFirearm.value_raw ? parseFloat(String(newFirearm.value_raw)) : 0.0

    if (isNaN(roundCount) || isNaN(value)) {
      // Alert.alert('Error', 'Round Count and Value must be valid numbers.')
      setFieldErrors(prev => ({
        ...prev,
        round_count_raw: isNaN(roundCount) ? 'Round Count must be a valid number.' : undefined,
        value_raw: isNaN(value) ? 'Value must be a valid number.' : undefined
      }))
      return
    }

    const firearmToAdd: Firearm = {
      id: Date.now(),
      owner_user_id: 0,
      name: newFirearm.name!,
      type: newFirearm.type!,
      serial_number: newFirearm.serial_number!,
      manufacturer: newFirearm.manufacturer || null,
      model_name: newFirearm.model_name || null,
      caliber: newFirearm.caliber || '',
      acquisition_date_raw:
        newFirearm.acquisition_date_raw instanceof Date
          ? newFirearm.acquisition_date_raw.toISOString()
          : newFirearm.acquisition_date_raw || null,
      purchase_price: newFirearm.purchase_price || null,
      ballistic_performance: newFirearm.ballistic_performance || null,
      image_raw: newFirearm.image_raw || null,
      round_count_raw: roundCount,
      value_raw: value,
      status_raw: newFirearm.status_raw || null,
      last_fired:
        newFirearm.last_fired instanceof Date ? newFirearm.last_fired.toISOString() : newFirearm.last_fired || null,
      last_cleaned:
        newFirearm.last_cleaned instanceof Date
          ? newFirearm.last_cleaned.toISOString()
          : newFirearm.last_cleaned || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      addFirearm(firearmToAdd)
      // Alert.alert('Success', 'Firearm added locally! (Backend integration needed)')
      setNewFirearm(initialFirearmState)
      closeDrawer()
    } catch (e: any) {
      // Alert.alert('Error', e.message || storeError || 'Failed to add firearm locally.')
      setFieldErrors(prev => ({ ...prev, error: e.message || storeError || 'Failed to add firearm locally.' })) // General form error, not field specific
    }
  }

  // Helper function to determine if a field is the last in its section for styling
  const isLastRowInSection = (field: keyof CreateFirearmPayload): boolean => {
    const primaryDetailsLastFields = ['caliber']
    const acquisitionLastFields = ['value_raw']
    const usageLastFields = ['last_cleaned']
    const additionalLastFields = ['image_raw']

    return (
      primaryDetailsLastFields.includes(field) ||
      acquisitionLastFields.includes(field) ||
      usageLastFields.includes(field) ||
      additionalLastFields.includes(field)
    )
  }

  const renderDetailRow = (
    label: string,
    field: keyof CreateFirearmPayload,
    placeholder: string,
    inputType: 'text' | 'date' | 'select' = 'text',
    // For select type
    items?: Array<{ label: string; value: string | number }>,
    // For text type
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => {
    const fieldValue = newFirearm[field]
    const error = fieldErrors[field]

    let inputComponent: React.ReactNode = null

    if (inputType === 'date') {
      const displayValue = fieldValue
        ? fieldValue instanceof Date
          ? (fieldValue as Date).toLocaleDateString()
          : new Date(fieldValue as string).toLocaleDateString()
        : placeholder
      inputComponent = (
        <TouchableOpacity onPress={() => showMode(field)} style={styles.dateContainer}>
          <Text style={[styles.dateText, fieldValue ? {} : styles.placeholderText]}>{displayValue}</Text>
        </TouchableOpacity>
      )
    } else if (inputType === 'select') {
      inputComponent = (
        <View style={styles.inputContainer}>
          <Select
            items={items || []}
            selectedValue={fieldValue as string | number | undefined}
            onValueChange={value => handleInputChange(field, value)}
            placeholder={placeholder}
            style={{
              selectButton: {
                backgroundColor: colors.backgroundSubtle,
                borderColor: colors.primarySubtle,
                minHeight: 40,
                height: 40,
                paddingVertical: 8,
                paddingHorizontal: 12
              },
              selectButtonText: {
                fontSize: 15,
                color: fieldValue ? colors.text : colors.textTertiary
              },
              arrow: {
                color: colors.primary,
                fontSize: 14
              },
              modalContent: {
                backgroundColor: colors.backgroundCard,
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 8
              },
              modalItem: {
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomColor: colors.primarySubtle
              },
              modalItemText: {
                fontSize: 15,
                color: colors.text
              },
              modalOverlay: {
                backgroundColor: 'rgba(0,0,0,0.8)'
              }
            }}
          />
        </View>
      )
    } else {
      // inputType === 'text'
      inputComponent = (
        <TextInput
          style={styles.inputStyle}
          value={fieldValue ? String(fieldValue) : ''}
          onChangeText={text => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
        />
      )
    }

    return (
      <View style={styles.detailRowContainer}>
        <View style={[styles.detailRow, isLastRowInSection(field) && styles.detailRowLast]}>
          <Text style={styles.detailLabel}>{label}</Text>
          {inputComponent}
        </View>
        {error && <Text style={styles.errorTextBelow}>{error}</Text>}
      </View>
    )
  }

  // Constants for Select components
  const FIREARM_TYPES = [
    { label: 'Pistol', value: 'Pistol' },
    { label: 'Revolver', value: 'Revolver' },
    { label: 'Rifle', value: 'Rifle' },
    { label: 'Shotgun', value: 'Shotgun' },
    { label: 'Derringer', value: 'Derringer' },
    { label: 'Other', value: 'Other' }
  ]

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
      borderColor: colors.primarySubtle,
      position: 'relative',
      padding: 1
    },
    progressBar: {
      height: '100%',
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
      borderColor: 'rgba(255,255,255,0.3)'
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
    }
  })

  const getFirearmIconByType = (type: string) => {
    const typeLower = type.toLowerCase() || ''
    if (typeLower.includes('pistol') || typeLower.includes('handgun')) {
      return 'target'
    } else if (typeLower.includes('rifle')) {
      return 'crosshairs'
    } else if (typeLower.includes('shotgun')) {
      return 'crosshairs'
    } else if (typeLower.includes('nfa')) {
      return 'shield'
    }
    return 'crosshairs-gps'
  }

  // Animate progress bar when step changes
  useEffect(() => {
    // Calculate the actual step position - steps are 1-indexed, but we need fractional progress
    // For example: Step 1 of 4 should be 25% progress (actually slightly less to ensure dot visibility)
    const stepPosition = (currentStep - 1) / (steps.length - 1)

    Animated.timing(progressAnim, {
      toValue: stepPosition,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start()
  }, [currentStep, progressAnim, steps.length])

  return (
    <React.Fragment>
      <ScrollView style={styles.container} keyboardShouldPersistTaps='handled'>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name={getFirearmIconByType(newFirearm.type || '')}
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>Add New Firearm</Text>
            <Text style={styles.subtitle}>Enter the details below to add a new firearm to your collection</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
            ]}
          />
        </View>

        {/* Step 1: Primary Details */}
        {currentStep === 1 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='information-outline' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Primary Details</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Name', 'name', 'Enter firearm name', 'text', undefined, 'default')}
              {renderDetailRow('Type', 'type', 'Select Firearm Type', 'select', FIREARM_TYPES)}
              {renderDetailRow('Serial Number', 'serial_number', 'Enter serial number', 'text', undefined, 'default')}
              {renderDetailRow('Manufacturer', 'manufacturer', 'Enter manufacturer', 'text', undefined, 'default')}
              {renderDetailRow('Model', 'model_name', 'Enter model name', 'text', undefined, 'default')}
              {renderDetailRow('Caliber', 'caliber', 'Enter caliber', 'text', undefined, 'default')}
            </View>
          </View>
        )}

        {/* Step 2: Acquisition & Value */}
        {currentStep === 2 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='cash' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Acquisition & Value</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Acquisition Date', 'acquisition_date_raw', 'Select date', 'date')}
              {renderDetailRow('Purchase Price', 'purchase_price', 'e.g., 500.00', 'text', undefined, 'numeric')}
              {renderDetailRow('Current Value', 'value_raw', 'e.g., 450.00', 'text', undefined, 'numeric')}
            </View>
          </View>
        )}

        {/* Step 3: Usage & Maintenance */}
        {currentStep === 3 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='bullseye-arrow' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Usage & Maintenance</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Round Count', 'round_count_raw', 'e.g., 1500', 'text', undefined, 'numeric')}
              {renderDetailRow('Last Fired Date', 'last_fired', 'Select date', 'date')}
              {renderDetailRow('Last Cleaned Date', 'last_cleaned', 'Select date', 'date')}
            </View>
          </View>
        )}

        {/* Step 4: Additional Information */}
        {currentStep === 4 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='note-text-outline' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Status', 'status_raw', 'e.g., In Service, In Storage', 'text', undefined, 'default')}
              {renderDetailRow(
                'Ballistic Performance',
                'ballistic_performance',
                'e.g., Sub-MOA at 100yds',
                'text',
                undefined,
                'default'
              )}
              {renderDetailRow('Image URL', 'image_raw', 'Optional: http://image.url', 'text', undefined, 'default')}
            </View>
          </View>
        )}

        {storeError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name='alert-circle' size={20} color={colors.error} />
            <Text style={styles.errorText}>Error: {storeError}</Text>
          </View>
        )}

        <View style={styles.stepButtonContainer}>
          {currentStep > 1 ? (
            <Button
              title='Previous'
              onPress={() => setCurrentStep(currentStep - 1)}
              variant='outline'
              style={styles.buttonHalfWidth}
            />
          ) : (
            <View style={styles.buttonHalfWidth} />
          )}
          {currentStep < steps.length && (
            <Button title='Next' onPress={handleNextStep} variant='primary' style={styles.buttonHalfWidth} />
          )}
        </View>

        {currentStep === steps.length && (
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? 'Adding...' : 'Add Firearm'}
              onPress={handleSaveFirearm}
              disabled={isLoading}
              variant='primary'
            />
            <Button title='Cancel' onPress={closeDrawer} variant='ghost' style={{ marginTop: 12 }} />
          </View>
        )}
      </ScrollView>
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType='fade'
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false)
            setDatePickerField(null)
          }}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => {
              setShowDatePicker(false)
              setDatePickerField(null)
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    testID='dateTimePicker'
                    value={currentDateValue}
                    mode={'date'}
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    themeVariant='dark'
                    textColor={colors.text}
                    accentColor={colors.primary}
                  />
                </View>

                <View style={styles.datePickerActions}>
                  <Button
                    title='Cancel'
                    onPress={() => {
                      setShowDatePicker(false)
                      setDatePickerField(null)
                    }}
                    variant='ghost'
                    style={{ marginRight: 8 }}
                  />
                  <Button
                    title='Confirm'
                    onPress={() => onDateChange({ type: 'set' } as DateTimePickerEvent, currentDateValue)}
                    variant='primary'
                  />
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </React.Fragment>
  )
}
