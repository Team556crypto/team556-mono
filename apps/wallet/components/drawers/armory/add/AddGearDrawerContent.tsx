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
  Easing,
  Image,
  Alert,
  Linking
} from 'react-native'
import { Text, useTheme, Button, Select } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { CreateFirearmPayload } from '@/services/api'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { armoryStyles } from '../styles'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Constants for calculating progress bar width
const DRAWER_HORIZONTAL_PADDING = 20 // From @team556/ui Drawer component's scrollContent
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20 // From local styles.headerGradient
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1 // From local styles.progressContainer

const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2

const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR // SCREEN_WIDTH - 40 - 40 - 2 = SCREEN_WIDTH - 82

type FirearmFormState = Omit<
  CreateFirearmPayload,
  'acquisition_date' | 'last_fired' | 'last_cleaned' | 'purchase_price' | 'round_count' | 'value'
> & {
  acquisition_date?: Date | string | undefined
  last_fired?: Date | string | undefined
  last_cleaned?: Date | string | undefined
  image_base64?: string | null
  purchase_price: string
  round_count: string
  value: string
}

const initialFirearmState: FirearmFormState = {
  name: '',
  type: '',
  serial_number: '',
  manufacturer: '',
  model_name: '',
  caliber: '',
  acquisition_date: undefined,
  purchase_price: '',
  ballistic_performance: '',
  image_base64: undefined,
  round_count: '0',
  value: '0',
  status: '',
  last_fired: undefined,
  last_cleaned: undefined
}

export const AddFirearmDrawerContent = () => {
  const { colors } = useTheme()
  const { addFirearm, isLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const progressAnim = useRef(new Animated.Value(0)).current

  const [newFirearm, setNewFirearm] = useState<FirearmFormState>(initialFirearmState)
  const [currentStep, setCurrentStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FirearmFormState, string>>>({})
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof FirearmFormState | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 3],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH] // Use calculated numerical width
  })

  const steps = ['Primary Details', 'Acquisition & Value', 'Usage & Maintenance', 'Additional Info']

  const styles = armoryStyles(colors, SCREEN_WIDTH)

  const handleInputChange = (field: keyof FirearmFormState, value: any) => {
    setNewFirearm((prev: FirearmFormState) => ({ ...prev, [field]: value }))
    setFieldErrors((prev: Partial<Record<keyof FirearmFormState, string>>) => ({
      ...prev,
      [field]: '' // Clear error when input changes
    }))
  }

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('AddFirearmDrawerContent: onDateChange event:', event.type, 'selectedDate:', selectedDate)
    setShowDatePicker(false) // Hide picker on any action
    if (event.type === 'set' && selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate.toISOString())
    }
    setDatePickerField(null) // Reset the field being edited
  }

  const showMode = (fieldKey: keyof FirearmFormState) => {
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
    const errors: Partial<Record<keyof FirearmFormState, string>> = {}

    if (!name) errors.name = 'Required'
    if (!type) errors.type = 'Required'
    if (!serial_number) errors.serial_number = 'Required'
    if (!manufacturer) errors.manufacturer = 'Required'
    if (!model_name) errors.model_name = 'Required'
    if (!caliber) errors.caliber = 'Required'

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const { value, purchase_price } = newFirearm
    const errors: Partial<Record<keyof FirearmFormState, string>> = {}
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const val = parseFloat(String(value))
      if (isNaN(val)) {
        errors.value = 'Must be a valid number.'
      }
    }
    if (purchase_price !== undefined && purchase_price !== null && String(purchase_price).trim() !== '') {
      // Allows for decimal numbers. Regex checks for optional leading digits, an optional decimal point, and optional trailing digits.
      // Ensures it's not just whitespace or an empty string if provided.
      if (!/^\d*\.?\d+$/.test(String(purchase_price).trim()) && !/^\d+\.?\d*$/.test(String(purchase_price).trim())) {
        if (String(purchase_price).trim() !== '') {
          // only error if not empty and invalid
          errors.purchase_price = 'Must be a valid price.'
        }
      } else {
        // Additional check for parseFloat if regex passes but could still be problematic (e.g. multiple decimal points if regex was less strict)
        const priceVal = parseFloat(String(purchase_price).trim())
        if (isNaN(priceVal)) {
          errors.purchase_price = 'Must be a valid price.'
        }
      }
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const { round_count } = newFirearm
    const errors: Partial<Record<keyof FirearmFormState, string>> = {}
    if (round_count !== undefined && round_count !== null && String(round_count).trim() !== '') {
      const count = parseInt(String(round_count), 10)
      if (isNaN(count)) {
        errors.round_count = 'Must be a valid number.'
      }
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    // Clear previous errors for the current step's fields before re-validating
    if (currentStep === 1) {
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
    } else if (currentStep === 2) {
      setFieldErrors(prev => ({ ...prev, value: undefined, purchase_price: undefined, acquisition_date: undefined })) // Clear step 2 fields
      if (!validateStep2()) {
        return
      }
    } else if (currentStep === 3) {
      setFieldErrors(prev => ({ ...prev, round_count: undefined, last_fired: undefined, last_cleaned: undefined })) // Clear step 3 fields
      if (!validateStep3()) {
        return
      }
    }
    // For step 4, validation is primarily in handleSaveFirearm (e.g., image)

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSaveFirearm = async () => {
    // Final validation before saving
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      // If any validation fails, find the first step with an error and navigate to it.
      if (!validateStep1()) {
        setCurrentStep(1)
        return
      }
      if (!validateStep2()) {
        setCurrentStep(2)
        return
      }
      if (!validateStep3()) {
        setCurrentStep(3)
        return
      }
      return // Should not be reached, but for safety
    }

    // Prepare the payload for the API, converting types as needed.
    const firearmToSave: CreateFirearmPayload = {
      // Required fields
      name: newFirearm.name.trim(),
      type: newFirearm.type,
      serial_number: newFirearm.serial_number.trim(),

      // Optional string fields
      manufacturer: newFirearm.manufacturer?.trim() || undefined,
      model_name: newFirearm.model_name?.trim() || undefined,
      caliber: newFirearm.caliber?.trim() || undefined,
      ballistic_performance: newFirearm.ballistic_performance?.trim() || undefined,
      status: newFirearm.status?.trim() || undefined,

      // Date fields (convert to ISO string or undefined)
      acquisition_date: newFirearm.acquisition_date ? new Date(newFirearm.acquisition_date).toISOString() : undefined,
      last_fired: newFirearm.last_fired ? new Date(newFirearm.last_fired).toISOString() : undefined,
      last_cleaned: newFirearm.last_cleaned ? new Date(newFirearm.last_cleaned).toISOString() : undefined,

      // Numeric fields (parse from string or set to undefined)
      purchase_price: newFirearm.purchase_price ? parseFloat(newFirearm.purchase_price) : undefined,
      round_count: newFirearm.round_count ? parseInt(newFirearm.round_count, 10) : undefined,
      value: newFirearm.value ? parseFloat(newFirearm.value) : undefined,

      // Image field
      image_base64: selectedImageBase64 || undefined,
      image: undefined, // Let the backend handle generating the image URL
    }

    console.log('AddFirearmDrawerContent: Saving firearm with payload:', JSON.stringify(firearmToSave, null, 2))

    const success = await addFirearm(firearmToSave, token)

    if (success) {
      setNewFirearm(initialFirearmState)
      setSelectedImageUri(null)
      setSelectedImageBase64(null)
      setCurrentStep(1)
      closeDrawer()
    } else {
      setFieldErrors(prev => ({
        ...prev,
        formError: storeError || 'Failed to save firearm. Please check your connection or try again.'
      }))
    }
  }

  const isLastRowInSection = (field: keyof FirearmFormState): boolean => {
    const primaryDetailsLastFields = ['caliber']
    const acquisitionLastFields = ['value']
    const usageLastFields = ['last_cleaned']
    const additionalLastFields = ['image']

    return (
      primaryDetailsLastFields.includes(field) ||
      acquisitionLastFields.includes(field) ||
      usageLastFields.includes(field) ||
      additionalLastFields.includes(field)
    )
  }

  const getDateForPicker = (value: string | Date | undefined): Date | null => {
    if (value instanceof Date) {
      return value
    }
    if (typeof value === 'string') {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d
    }
    return null
  }

  const renderDetailRow = (
    label: string,
    field: keyof FirearmFormState,
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
      if (Platform.OS === 'web') {
        inputComponent = (
          <View style={styles.datePickerWeb}>
            <DatePicker
              selected={getDateForPicker(fieldValue as Date | string | undefined)}
              onChange={(date: Date | null) => handleInputChange(field, date)}
              dateFormat='yyyy-MM-dd'
              placeholderText='YYYY-MM-DD'
              customInput={
                <TextInput
                  style={styles.inputStyle}
                  onChangeText={(text: string) => handleInputChange(field, text)}
                  placeholderTextColor={colors.textTertiary}
                />
              }
              portalId='datepicker-portal'
              calendarClassName='dark-theme-datepicker'
              popperClassName='dark-theme-datepicker-popper'
            />
          </View>
        )
      } else {
        const displayValue = fieldValue
          ? fieldValue instanceof Date
            ? (fieldValue as Date).toLocaleDateString()
            : typeof fieldValue === 'string' && new Date(fieldValue).toString() !== 'Invalid Date'
              ? new Date(fieldValue as string).toLocaleDateString()
              : placeholder // Fallback to placeholder if string is not a valid date
          : placeholder
        inputComponent = (
          <TouchableOpacity onPress={() => showMode(field as any)} style={styles.dateContainer}>
            <Text style={[styles.dateText, fieldValue ? {} : styles.placeholderText]}>{displayValue}</Text>
          </TouchableOpacity>
        )
      }
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
          value={fieldValue as string}
          onChangeText={(text: string) => handleInputChange(field, text)}
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

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        if (canAskAgain) {
          // The user was prompted, but might have dismissed it.
          // We can show a simple alert.
          Alert.alert('Permission Required', 'We need access to your photo library to select an image.')
        } else {
          // Guide user to settings if permission is permanently denied
          Alert.alert(
            'Permission Required',
            'Access to the photo library is permanently denied. Please go to your device settings to enable it.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          )
        }
        return false
      }
    }
    return true
  }

  const pickImageAsync = async () => {
    const hasPermission = await requestMediaLibraryPermissions()
    if (!hasPermission) return

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Lower quality for faster uploads & less storage
      base64: true // Request base64 data
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      setSelectedImageUri(asset.uri)
      setSelectedImageBase64(asset.base64 || null)
      // Clear previous image URL error if any
      setFieldErrors(prev => ({ ...prev, image_base64: undefined }))
    } else {
      // Handle cancellation or no assets selected (optional)
      // setSelectedImageUri(null);
      // setSelectedImageBase64(null);
    }
  }

  const FIREARM_TYPES = [
    { label: 'Pistol', value: 'Pistol' },
    { label: 'Revolver', value: 'Revolver' },
    { label: 'Rifle', value: 'Rifle' },
    { label: 'Shotgun', value: 'Shotgun' },
    { label: 'Derringer', value: 'Derringer' },
    { label: 'Other', value: 'Other' }
  ]

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
          <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
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
              {renderDetailRow('Acquisition Date', 'acquisition_date', 'Select date', 'date')}
              {renderDetailRow('Purchase Price', 'purchase_price', 'e.g., 500.00', 'text', undefined, 'numeric')}
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
              {renderDetailRow('Round Count', 'round_count', 'e.g., 1500', 'text', undefined, 'numeric')}
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
              <View style={styles.inputRow}>
                <Text style={styles.label}>Firearm Image</Text>
                <Button title='Select Image' onPress={pickImageAsync} variant='outline' style={{ marginBottom: 10 }} />
                {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />}
                {fieldErrors.image_base64 && <Text style={styles.errorText}>{fieldErrors.image_base64}</Text>}
              </View>
              {renderDetailRow('Status', 'status', 'e.g., In Service, In Storage', 'text', undefined, 'default')}
              {renderDetailRow(
                'Ballistic Performance',
                'ballistic_performance',
                'e.g., Sub-MOA at 100yds',
                'text',
                undefined,
                'default'
              )}
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
