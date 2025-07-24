import React, { useState, useEffect, useRef } from 'react'
import {
  View,
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
import { armoryStyles } from './styles'

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

  const styles = armoryStyles(colors, SCREEN_WIDTH)

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