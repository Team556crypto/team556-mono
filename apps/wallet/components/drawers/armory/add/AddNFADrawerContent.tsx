import React, { useState, useEffect, useRef } from 'react'
import {
  View, ScrollView, TextInput, TouchableOpacity, Platform, Modal,
  Dimensions, Animated, Easing, Image, Alert, Linking
} from 'react-native'
import { Text, useTheme, Button, Select, nfaTypeOptions, taxStampTypeOptions } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { CreateNFAPayload } from '@/services/api'
import { useNFAStore } from '@/store/nfaStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { armoryStyles } from './styles'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DRAWER_HORIZONTAL_PADDING = 20
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1
const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2
const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR

type NFAFormState = Omit<CreateNFAPayload, 'tax_stamp_submission_date' | 'tax_stamp_approval_date' | 'value' | 'round_count'> & {
  tax_stamp_submission_date?: Date | string | undefined
  tax_stamp_approval_date?: Date | string | undefined
  value: string
  round_count: string
  picture_base64?: string
}

const initialNFAState: NFAFormState = {
  manufacturer: '',
  model_name: '',
  caliber: '',
  type: '',
  tax_stamp_type: '',
  tax_stamp_id_number: '',
  tax_stamp_submission_date: undefined,
  tax_stamp_approval_date: undefined,
  value: '',
  round_count: '0',
  picture: undefined,
  picture_base64: undefined
}

export const AddNFADrawerContent: React.FC = () => {
  const { colors } = useTheme()
  const { addNFA, isLoading } = useNFAStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newNFA, setNewNFA] = useState<NFAFormState>(initialNFAState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NFAFormState, string>> & { formError?: string }>({})
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof NFAFormState | null>(null)
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

  const handleInputChange = (field: keyof NFAFormState, value: any) => {
    setNewNFA(prev => ({ ...prev, [field]: value }))
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
    if (selectedDate && datePickerField && event.type === 'set') {
      handleInputChange(datePickerField, selectedDate)
      if (Platform.OS !== 'ios') setShowDatePicker(false)
    } else {
      setShowDatePicker(false)
    }
  }

  const showMode = (fieldKey: keyof NFAFormState) => {
    setDatePickerField(fieldKey)
    const fieldValue = newNFA[fieldKey]
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
    const errors: Partial<Record<keyof NFAFormState, string>> = {}
    if (!newNFA.manufacturer) errors.manufacturer = 'Manufacturer is required.'
    if (!newNFA.model_name) errors.model_name = 'Model is required.'
    if (!newNFA.caliber) errors.caliber = 'Caliber is required.'
    if (!newNFA.type) errors.type = 'NFA type is required.'
    if (!newNFA.tax_stamp_type) errors.tax_stamp_type = 'Tax stamp type is required.'
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors: Partial<Record<keyof NFAFormState, string>> = {}
    if (!newNFA.tax_stamp_id_number) errors.tax_stamp_id_number = 'Tax stamp ID number is required.'
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const errors: Partial<Record<keyof NFAFormState, string>> = {}
    if (newNFA.value && parseFloat(newNFA.value) < 0) {
      errors.value = 'Value cannot be negative.'
    }
    if (newNFA.round_count && parseInt(newNFA.round_count, 10) < 0) {
      errors.round_count = 'Round count cannot be negative.'
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

  const handleSaveNFA = async () => {
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

    const nfaData: CreateNFAPayload = {
      manufacturer: newNFA.manufacturer.trim(),
      model_name: newNFA.model_name.trim(),
      caliber: newNFA.caliber.trim(),
      type: newNFA.type,
      tax_stamp_type: newNFA.tax_stamp_type,
      tax_stamp_id_number: newNFA.tax_stamp_id_number.trim(),
      tax_stamp_submission_date: newNFA.tax_stamp_submission_date 
        ? new Date(newNFA.tax_stamp_submission_date).toISOString() 
        : undefined,
      tax_stamp_approval_date: newNFA.tax_stamp_approval_date 
        ? new Date(newNFA.tax_stamp_approval_date).toISOString() 
        : undefined,
      value: newNFA.value ? parseFloat(newNFA.value) : undefined,
      round_count: newNFA.round_count ? parseInt(newNFA.round_count, 10) : undefined,
      picture_base64: newNFA.picture_base64 || undefined,
    }

    try {
      await addNFA(nfaData, token)
      closeDrawer()
      setNewNFA(initialNFAState)
      setSelectedImageUri(null)
      setCurrentStep(1)
      setFieldErrors({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
      setFieldErrors({ formError: `Failed to save NFA item: ${errorMessage}` })
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
        handleInputChange('picture_base64', `data:image/jpeg;base64,${asset.base64}`)
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
    field: keyof NFAFormState,
    placeholder: string,
    inputType: 'text' | 'select' = 'text',
    items?: Array<{ label: string; value: string }>,
    keyboardType: 'default' | 'numeric' = 'default'
  ) => {
    const fieldValue = newNFA[field]
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="shield-check" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Add New NFA Item</Text>
        <Text style={styles.subtitle}>Register your NFA firearms with tax stamp details</Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
      </View>

      {currentStep === 1 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Primary Details</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderDetailRow('Manufacturer', 'manufacturer', 'Enter manufacturer')}
            {renderDetailRow('Model', 'model_name', 'Enter model name')}
            {renderDetailRow('Caliber', 'caliber', 'Enter caliber')}
            {renderDetailRow('NFA Type', 'type', 'Select NFA Type', 'select', nfaTypeOptions)}
            {renderDetailRow('Tax Stamp Type', 'tax_stamp_type', 'Select Form Type', 'select', taxStampTypeOptions)}
          </View>
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-certificate" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tax Stamp Information</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderDetailRow('Tax Stamp ID Number', 'tax_stamp_id_number', 'Enter stamp number')}
            <View style={styles.detailRowContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submission Date</Text>
                <TouchableOpacity onPress={() => showMode('tax_stamp_submission_date')} style={styles.dateContainer}>
                  <Text style={[styles.dateText, newNFA.tax_stamp_submission_date ? {} : styles.placeholderText]}>
                    {newNFA.tax_stamp_submission_date 
                      ? new Date(newNFA.tax_stamp_submission_date).toLocaleDateString() 
                      : 'Select a date'}
                  </Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.tax_stamp_submission_date && (
                <Text style={styles.errorTextBelow}>{fieldErrors.tax_stamp_submission_date}</Text>
              )}
            </View>
            <View style={styles.detailRowContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approval Date</Text>
                <TouchableOpacity onPress={() => showMode('tax_stamp_approval_date')} style={styles.dateContainer}>
                  <Text style={[styles.dateText, newNFA.tax_stamp_approval_date ? {} : styles.placeholderText]}>
                    {newNFA.tax_stamp_approval_date 
                      ? new Date(newNFA.tax_stamp_approval_date).toLocaleDateString() 
                      : 'Select a date'}
                  </Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.tax_stamp_approval_date && (
                <Text style={styles.errorTextBelow}>{fieldErrors.tax_stamp_approval_date}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {currentStep === 3 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-variant" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderDetailRow('Value', 'value', '$0.00', 'text', undefined, 'numeric')}
            {renderDetailRow('Round Count', 'round_count', '0', 'text', undefined, 'numeric')}
            <TouchableOpacity onPress={pickImageAsync} style={styles.imagePicker}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>Add Photo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {fieldErrors.formError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fieldErrors.formError}</Text>
        </View>
      )}

      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <Button title="Back" onPress={handleBackStep} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        )}
        {currentStep < 3 ? (
          <Button title="Next" onPress={handleNextStep} variant="primary" style={{ flex: 1 }} />
        ) : (
          <Button title="Save NFA Item" onPress={handleSaveNFA} variant="primary" style={{ flex: 1 }} loading={isLoading} />
        )}
      </View>

      {renderDatePicker()}
    </ScrollView>
  )
}

export default AddNFADrawerContent
