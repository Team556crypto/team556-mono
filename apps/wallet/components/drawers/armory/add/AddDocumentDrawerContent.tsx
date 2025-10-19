import React, { useState, useEffect, useRef } from 'react'
import {
  View,
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
import { Text, useTheme, Button, Select, documentTypeOptions } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { CreateDocumentPayload } from '@team556/ui'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { armoryStyles } from './styles'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Constants for calculating progress bar width
const DRAWER_HORIZONTAL_PADDING = 20
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1

const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2

const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR

// Define a type for the form state that allows Date objects for date fields
type DocumentFormState = Omit<CreateDocumentPayload, 'issue_date' | 'expiration_date'> & {
  issue_date?: Date | string | undefined
  expiration_date?: Date | string | undefined
  attachment_base64?: string | null
  attachment_back_base64?: string | null
}

const initialDocumentState: DocumentFormState = {
  name: '',
  type: '',
  issuing_authority: '',
  issue_date: undefined,
  expiration_date: undefined,
  document_number: '',
  notes: '',
  attachments: undefined,
  attachment_base64: null,
  attachment_back_base64: null
}

export const AddDocumentDrawerContent = () => {
  const { colors } = useTheme()
  const { addDocument, isLoading, error: storeError } = useDocumentStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newDocument, setNewDocument] = useState<DocumentFormState>(initialDocumentState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DocumentFormState, string>>>({})

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 2],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH]
  })

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null)
  const [selectedImageBackUri, setSelectedImageBackUri] = useState<string | null>(null)
  const [selectedImageBackBase64, setSelectedImageBackBase64] = useState<string | null>(null)

  const steps = ['Document Identification', 'Authority & Dates', 'Attachments & Notes']

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof DocumentFormState | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  const styles = armoryStyles(colors, SCREEN_WIDTH)

  const handleInputChange = (field: keyof DocumentFormState, value: any) => {
    setNewDocument((prev: DocumentFormState) => ({ ...prev, [field]: value }))
    setFieldErrors((prev: Partial<Record<keyof DocumentFormState, string>>) => ({
      ...prev,
      [field]: ''
    }))
  }

  // Specific handler for date changes from the picker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('AddDocumentDrawerContent: onDateChange event:', event.type, 'selectedDate:', selectedDate)
    setShowDatePicker(false)
    if (event.type === 'set' && selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate.toISOString())
    }
    setDatePickerField(null)
  }

  const showMode = (fieldKey: keyof DocumentFormState) => {
    console.log('AddDocumentDrawerContent: showMode called for field:', fieldKey)
    const fieldValue = newDocument[fieldKey]
    const initialPickerDate =
      fieldValue instanceof Date
        ? fieldValue
        : typeof fieldValue === 'string' && !isNaN(new Date(fieldValue).getTime())
          ? new Date(fieldValue)
          : new Date()

    console.log('AddDocumentDrawerContent: Initial picker date:', initialPickerDate)
    setCurrentDateValue(initialPickerDate)
    setDatePickerField(fieldKey)
    setShowDatePicker(true)
    console.log('AddDocumentDrawerContent: showDatePicker set to true')
  }

  const validateStep1 = () => {
    const { name, type } = newDocument
    const errors: Partial<Record<keyof DocumentFormState, string>> = {}

    if (!name) errors.name = 'Required'
    if (!type) errors.type = 'Required'

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    // Step 2 fields are all optional
    return true
  }

  const validateStep3 = () => {
    // Step 3 fields are all optional
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      setFieldErrors(prev => ({
        ...prev,
        name: undefined,
        type: undefined,
        document_number: undefined
      }))
      if (!validateStep1()) {
        return
      }
    } else if (currentStep === 2) {
      setFieldErrors(prev => ({
        ...prev,
        issuing_authority: undefined,
        issue_date: undefined,
        expiration_date: undefined
      }))
      if (!validateStep2()) {
        return
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSaveDocument = async () => {
    // Final validation before saving
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      if (!validateStep1()) {
        setCurrentStep(1)
        return
      }
      return
    }

    // Build attachments array
    const attachmentsArray: string[] = []
    if (selectedImageBase64) {
      attachmentsArray.push(`data:image/jpeg;base64,${selectedImageBase64}`)
    }
    if (selectedImageBackBase64) {
      attachmentsArray.push(`data:image/jpeg;base64,${selectedImageBackBase64}`)
    }

    // Prepare the payload for the API
    const documentToSave: CreateDocumentPayload = {
      name: newDocument.name.trim(),
      type: newDocument.type,
      issuing_authority: newDocument.issuing_authority?.trim() || undefined,
      issue_date: newDocument.issue_date ? new Date(newDocument.issue_date).toISOString() : undefined,
      expiration_date: newDocument.expiration_date ? new Date(newDocument.expiration_date).toISOString() : undefined,
      document_number: newDocument.document_number?.trim() || undefined,
      notes: newDocument.notes?.trim() || undefined,
      attachments: attachmentsArray.length > 0 ? JSON.stringify(attachmentsArray) : undefined
    }

    console.log('AddDocumentDrawerContent: Saving document with payload:', JSON.stringify(documentToSave, null, 2))

    const success = await addDocument(documentToSave, token)

    if (success) {
      setNewDocument(initialDocumentState)
      setSelectedImageUri(null)
      setSelectedImageBase64(null)
      setSelectedImageBackUri(null)
      setSelectedImageBackBase64(null)
      setCurrentStep(1)
      closeDrawer()
    } else {
      setFieldErrors(prev => ({
        ...prev,
        formError: storeError || 'Failed to save document. Please check your connection or try again.'
      }))
    }
  }

  const isLastRowInSection = (field: keyof DocumentFormState): boolean => {
    const identificationLastFields = ['document_number']
    const datesLastFields = ['expiration_date']
    const attachmentsLastFields = ['notes']

    return (
      identificationLastFields.includes(field) ||
      datesLastFields.includes(field) ||
      attachmentsLastFields.includes(field)
    )
  }

  const getDateForPicker = (value: string | Date | undefined): Date | null => {
    if (value instanceof Date) {
      return value
    }
    if (typeof value === 'string') {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return d
      }
    }
    return null
  }

  const renderDetailRow = (
    label: string,
    field: keyof DocumentFormState,
    placeholder: string,
    inputType: 'text' | 'date' | 'select' | 'textarea' = 'text',
    items?: Array<{ label: string; value: string | number }>,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => {
    const fieldValue = newDocument[field]
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
              : placeholder
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
    } else if (inputType === 'textarea') {
      inputComponent = (
        <TextInput
          style={[styles.inputStyle, { height: 80, textAlignVertical: 'top' }]}
          value={fieldValue as string}
          onChangeText={(text: string) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
        />
      )
    } else {
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

  // Image Picker Logic
  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        if (canAskAgain) {
          Alert.alert('Permission Required', 'We need access to your photo library to select an image.')
        } else {
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

  const pickImageAsync = async (isFront: boolean = true) => {
    const hasPermission = await requestMediaLibraryPermissions()
    if (!hasPermission) return

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      if (isFront) {
        setSelectedImageUri(asset.uri)
        setSelectedImageBase64(asset.base64 || null)
      } else {
        setSelectedImageBackUri(asset.uri)
        setSelectedImageBackBase64(asset.base64 || null)
      }
      setFieldErrors(prev => ({ ...prev, attachment_base64: undefined }))
    }
  }

  // Animate progress bar when step changes
  useEffect(() => {
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
                name='file-document-outline'
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>Add New Document</Text>
            <Text style={styles.subtitle}>Enter the details below to add a new document to your collection</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
        </View>

        {/* Step 1: Document Identification */}
        {currentStep === 1 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='card-account-details-outline' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Document Identification</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Document Name', 'name', 'e.g., Texas CCW License', 'text', undefined, 'default')}
              {renderDetailRow('Document Type', 'type', 'Select Document Type', 'select', documentTypeOptions)}
              {renderDetailRow('Document Number', 'document_number', 'e.g., CCL-123456789', 'text', undefined, 'default')}
            </View>
          </View>
        )}

        {/* Step 2: Authority & Dates */}
        {currentStep === 2 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='calendar-check' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Authority & Dates</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Issuing Authority', 'issuing_authority', 'e.g., Texas DPS', 'text', undefined, 'default')}
              {renderDetailRow('Issue Date', 'issue_date', 'Select date', 'date')}
              {renderDetailRow('Expiration Date', 'expiration_date', 'Select date', 'date')}
            </View>
          </View>
        )}

        {/* Step 3: Attachments & Notes */}
        {currentStep === 3 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name='image-multiple-outline' size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Attachments & Notes</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Document Front (Scan/Photo)</Text>
                <Button title='Select Front Image' onPress={() => pickImageAsync(true)} variant='outline' style={{ marginBottom: 10 }} />
                {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />}
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.label}>Document Back (Optional)</Text>
                <Button title='Select Back Image' onPress={() => pickImageAsync(false)} variant='outline' style={{ marginBottom: 10 }} />
                {selectedImageBackUri && <Image source={{ uri: selectedImageBackUri }} style={styles.imagePreview} />}
              </View>

              {renderDetailRow('Notes', 'notes', 'Add any additional notes...', 'textarea', undefined, 'default')}
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
              title={isLoading ? 'Adding...' : 'Add Document'}
              onPress={handleSaveDocument}
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
