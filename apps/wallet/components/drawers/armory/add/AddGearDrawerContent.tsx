import React, { useState, useEffect, useRef } from 'react'
import {
  View, ScrollView, TextInput, TouchableOpacity, Platform, Modal,
  Dimensions, Animated, Easing, Image, Alert, Linking
} from 'react-native'
import { Text, useTheme, Button, Select } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { CreateGearPayload, GearSpecifications } from '@/services/api'
import { useGearStore } from '@/store/gearStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { armoryStyles } from './styles'
import {
  GEAR_CATEGORIES, GEAR_SUBCATEGORIES, GEAR_STATUS,
  ARMOR_LEVELS, MOUNT_TYPES, RETICLE_TYPES, BATTERY_TYPES, IP_RATINGS,
  getSubcategoriesForCategory,
} from '@/constants/gear'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DRAWER_HORIZONTAL_PADDING = 20
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1
const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2
const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR

type GearFormState = Omit<CreateGearPayload, 'purchaseDate' | 'purchasePrice' | 'quantity' | 'weightOz' | 'specifications'> & {
  purchaseDate?: Date | string | undefined
  purchasePrice: string
  quantity: string
  weightOz: string
  specifications: GearSpecifications
  pictures_base64?: string[]
}

const initialGearState: GearFormState = {
  name: '', type: '', category: '', subcategory: '', manufacturer: '', model: '', quantity: '1',
  condition: '', serialNumber: '', weightOz: '', dimensions: '', color: '', material: '',
  storageLocation: '', warrantyExpiration: undefined, lastMaintenance: undefined, purchaseDate: undefined,
  purchasePrice: '', specifications: {}, status: 'active', notes: '', pictures: undefined, pictures_base64: []
}

export const AddGearDrawerContent: React.FC = () => {
  const { colors } = useTheme()
  const { addGear, isLoading } = useGearStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newGear, setNewGear] = useState<GearFormState>(initialGearState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GearFormState, string>> & { formError?: string }>({})
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof GearFormState | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  const styles = armoryStyles(colors, SCREEN_WIDTH)

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 3],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH]
  })

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start()
  }, [currentStep])

  const handleInputChange = (field: keyof GearFormState, value: any) => {
    setNewGear(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'category') {
        updated.subcategory = ''
        updated.specifications = {}
        updated.type = value
      }
      return updated
    })
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSpecificationChange = (specField: string, value: any) => {
    setNewGear(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [specField]: value }
    }))
  }

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate && datePickerField && event.type === 'set') {
      handleInputChange(datePickerField, selectedDate)
      if (Platform.OS !== 'ios') setShowDatePicker(false)
    } else {
      setShowDatePicker(false)
    }
  }

  const showMode = (fieldKey: keyof GearFormState) => {
    setDatePickerField(fieldKey)
    const fieldValue = newGear[fieldKey]
    if (fieldValue instanceof Date) {
      setCurrentDateValue(fieldValue)
    } else if (typeof fieldValue === 'string' && !isNaN(Date.parse(fieldValue))) {
      setCurrentDateValue(new Date(fieldValue))
    } else {
      setCurrentDateValue(new Date())
    }
    setShowDatePicker(true)
  }

  const validateStep1 = () => {
    const errors: Partial<Record<keyof GearFormState, string>> = {}
    if (!newGear.name) errors.name = 'Name is required.'
    if (!newGear.category) errors.category = 'Category is required.'
    if (!newGear.subcategory) errors.subcategory = 'Subcategory is required.'
    if (!newGear.quantity || parseInt(newGear.quantity, 10) <= 0) {
      errors.quantity = 'Quantity must be greater than 0.'
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => true

  const validateStep3 = () => {
    const errors: Partial<Record<keyof GearFormState, string>> = {}
    if (!newGear.purchaseDate) errors.purchaseDate = 'Purchase date is required.'
    if (newGear.purchasePrice && parseFloat(newGear.purchasePrice) < 0) {
      errors.purchasePrice = 'Purchase price cannot be negative.'
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    let isValid = false
    if (currentStep === 1) isValid = validateStep1()
    else if (currentStep === 2) isValid = validateStep2()
    else if (currentStep === 3) isValid = validateStep3()

    if (isValid && currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handleBackStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSaveGear = async () => {
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

    const gearData: CreateGearPayload = {
      ...newGear,
      type: newGear.category,
      quantity: parseInt(newGear.quantity, 10),
      purchasePrice: newGear.purchasePrice ? parseFloat(newGear.purchasePrice) : undefined,
      weightOz: newGear.weightOz ? parseFloat(newGear.weightOz) : undefined,
      purchaseDate: newGear.purchaseDate ? new Date(newGear.purchaseDate).toISOString() : undefined,
      warrantyExpiration: newGear.warrantyExpiration ? new Date(newGear.warrantyExpiration).toISOString() : undefined,
      lastMaintenance: newGear.lastMaintenance ? new Date(newGear.lastMaintenance).toISOString() : undefined,
      specifications: Object.keys(newGear.specifications).length > 0 ? newGear.specifications : undefined,
      pictures: newGear.pictures_base64 ? newGear.pictures_base64[0] : undefined,
    }

    try {
      await addGear(gearData, token)
      closeDrawer()
      setNewGear(initialGearState)
      setSelectedImageUri(null)
      setCurrentStep(1)
      setFieldErrors({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
      setFieldErrors({ formError: `Failed to save gear: ${errorMessage}` })
    }
  }

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photo library.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ])
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
        <Modal transparent animationType='fade' visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              <View style={styles.datePickerContainer}>
                <Text preset='h4' style={styles.datePickerTitle}>Select Date</Text>
                <DatePicker
                  selected={currentDateValue}
                  onChange={date => {
                    if (datePickerField && date) handleInputChange(datePickerField, date)
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
        value={currentDateValue}
        mode={'date'}
        is24Hour={true}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onDateChange}
      />
    )
  }

  const renderDetailRow = (
    label: string,
    field: keyof GearFormState,
    placeholder: string,
    inputType: 'text' | 'select' = 'text',
    items?: Array<{ label: string; value: string }>,
    keyboardType: 'default' | 'numeric' = 'default'
  ) => {
    const fieldValue = newGear[field]
    const error = fieldErrors[field]

    let inputComponent: React.ReactNode = null

    if (inputType === 'select') {
      inputComponent = (
        <View style={styles.inputContainer}>
          <Select
            items={items || []}
            selectedValue={fieldValue as string}
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
              }
            }}
          />
        </View>
      )
    } else {
      inputComponent = (
        <TextInput
          style={styles.inputStyle}
          value={fieldValue as string}
          onChangeText={text => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
        />
      )
    }

    return (
      <View style={styles.detailRowContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          {inputComponent}
        </View>
        {error && <Text style={styles.errorTextBelow}>{error}</Text>}
      </View>
    )
  }

  const renderSpecDetailRow = (
    label: string,
    specField: string,
    placeholder: string,
    inputType: 'text' | 'select' = 'text',
    items?: Array<{ label: string; value: string }>,
    keyboardType: 'default' | 'numeric' = 'default'
  ) => {
    const fieldValue = newGear.specifications[specField]

    let inputComponent: React.ReactNode = null

    if (inputType === 'select') {
      inputComponent = (
        <View style={styles.inputContainer}>
          <Select
            items={items || []}
            selectedValue={(fieldValue as string) || ''}
            onValueChange={value => handleSpecificationChange(specField, value)}
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
              }
            }}
          />
        </View>
      )
    } else {
      inputComponent = (
        <TextInput
          style={styles.inputStyle}
          value={(fieldValue as string) || ''}
          onChangeText={text => handleSpecificationChange(specField, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
        />
      )
    }

    return (
      <View style={styles.detailRowContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          {inputComponent}
        </View>
      </View>
    )
  }

  const renderCategorySpecificFields = () => {
    switch (newGear.category) {
      case 'optics':
        return (
          <>
            {renderSpecDetailRow('Magnification', 'magnification', 'e.g., 1-6x')}
            {renderSpecDetailRow('Objective Lens', 'objectiveLens', 'e.g., 24mm')}
            {renderSpecDetailRow('Reticle Type', 'reticle', 'Select Reticle Type...', 'select', RETICLE_TYPES)}
            {renderSpecDetailRow('Mount Type', 'mountType', 'Select Mount Type...', 'select', MOUNT_TYPES)}
          </>
        )
      case 'communication':
        return (
          <>
            {renderSpecDetailRow('Frequency Range', 'frequency', 'e.g., 144-148 MHz')}
            {renderSpecDetailRow('Channels', 'channels', 'Number of channels', 'text', undefined, 'numeric')}
            {renderSpecDetailRow('Range', 'range', 'e.g., 5 miles')}
            {renderSpecDetailRow('Battery Type', 'batteryType', 'Select Battery Type...', 'select', BATTERY_TYPES)}
            {renderSpecDetailRow('IP Rating', 'waterproof', 'Select IP Rating...', 'select', IP_RATINGS)}
          </>
        )
      case 'protection':
        return (
          <>
            {renderSpecDetailRow('Protection Level', 'protectionLevel', 'Select NIJ Level...', 'select', ARMOR_LEVELS)}
            {renderSpecDetailRow('Coverage', 'coverage', 'e.g., Front & Back')}
          </>
        )
      case 'camping':
        return (
          <>
            {renderSpecDetailRow('Capacity', 'capacity', 'e.g., 2-person, 50L')}
            {renderSpecDetailRow('Temperature Rating', 'temperature', 'e.g., 20°F')}
          </>
        )
      case 'lighting':
        return (
          <>
            {renderSpecDetailRow('Lumens', 'lumens', 'Light output', 'text', undefined, 'numeric')}
            {renderSpecDetailRow('Runtime', 'runtime', 'e.g., 2 hours')}
            {renderSpecDetailRow('Beam Distance', 'beamDistance', 'e.g., 100m')}
            {renderSpecDetailRow('Battery Type', 'batteryType', 'Select Battery Type...', 'select', BATTERY_TYPES)}
          </>
        )
      case 'tools':
        return (
          <>
            {renderSpecDetailRow('Blade Length', 'bladeLength', 'e.g., 3.5"')}
            {renderSpecDetailRow('Blade Material', 'bladeMaterial', 'e.g., D2 Steel')}
            {renderSpecDetailRow('Handle Material', 'handleMaterial', 'e.g., G10')}
          </>
        )
      case 'medical':
        return <>{renderSpecDetailRow('Contents', 'contents', 'List of items')}</>
      default:
        return null
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="tent" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Add New Gear</Text>
        <Text style={styles.subtitle}>Create a detailed record of your gear</Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
      </View>

      {currentStep === 1 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderDetailRow('Name', 'name', 'Gear name')}
            {renderDetailRow('Category', 'category', 'Select Category...', 'select', GEAR_CATEGORIES)}
            {newGear.category && renderDetailRow('Subcategory', 'subcategory', 'Select Subcategory...', 'select', getSubcategoriesForCategory(newGear.category))}
            {renderDetailRow('Quantity', 'quantity', '1', 'text', undefined, 'numeric')}
          </View>
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Details & Specifications</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderDetailRow('Manufacturer', 'manufacturer', 'Manufacturer name')}
            {renderDetailRow('Model', 'model', 'Model name')}
            {renderDetailRow('Serial Number', 'serialNumber', 'Serial or ID number')}
            {newGear.category && renderCategorySpecificFields()}
          </View>
        </View>
      )}

      {currentStep === 3 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cart" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Purchase & Storage</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailRowContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase Date</Text>
                <TouchableOpacity onPress={() => showMode('purchaseDate')} style={styles.dateContainer}>
                  <Text style={[styles.dateText, newGear.purchaseDate ? {} : styles.placeholderText]}>
                    {newGear.purchaseDate ? new Date(newGear.purchaseDate).toLocaleDateString() : 'Select a date'}
                  </Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.purchaseDate && <Text style={styles.errorTextBelow}>{fieldErrors.purchaseDate}</Text>}
            </View>
            {renderDetailRow('Purchase Price', 'purchasePrice', '$0.00', 'text', undefined, 'numeric')}
            {renderDetailRow('Storage Location', 'storageLocation', 'Where is it stored?')}
            {renderDetailRow('Status', 'status', 'Select Status...', 'select', GEAR_STATUS)}
            <TouchableOpacity onPress={pickImageAsync} style={styles.imagePicker}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>Add Photo</Text>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.notesInput}
              value={newGear.notes}
              onChangeText={text => handleInputChange('notes', text)}
              placeholder="Add notes..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </View>
        </View>
      )}

      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <Button title="Back" onPress={handleBackStep} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        )}
        {currentStep < 3 ? (
          <Button title="Next" onPress={handleNextStep} variant="primary" style={{ flex: 1 }} />
        ) : (
          <Button title="Save Gear" onPress={handleSaveGear} variant="primary" style={{ flex: 1 }} loading={isLoading} />
        )}
      </View>

      {renderDatePicker()}
    </ScrollView>
  )
}

export default AddGearDrawerContent
