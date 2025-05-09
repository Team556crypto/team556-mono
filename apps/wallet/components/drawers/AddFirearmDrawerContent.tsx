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
  Image
} from 'react-native'
import { Text, useTheme, Button, Select } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker';
import { Firearm, CreateFirearmPayload } from '@/services/api'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'

// Initial state for a new firearm
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Define a type for the form state that allows Date objects for date fields
// before they are converted to ISO strings for the API payload.
type FirearmFormState = Omit<CreateFirearmPayload, 'acquisition_date' | 'last_fired' | 'last_cleaned'> & {
  acquisition_date?: Date | string | undefined;
  last_fired?: Date | string | undefined;
  last_cleaned?: Date | string | undefined;
  image_base64?: string | null;
};

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
  round_count: 0,
  value: 0.0,
  status: '',
  last_fired: undefined,
  last_cleaned: undefined
}

export const AddFirearmDrawerContent = () => {
  const { colors } = useTheme()
  const { addFirearm, isLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newFirearm, setNewFirearm] = useState<FirearmFormState>(initialFirearmState)
  const [currentStep, setCurrentStep] = useState(1)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FirearmFormState, string>>>({})

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);

  const steps = ['Primary Details', 'Acquisition & Value', 'Usage & Maintenance', 'Additional Info']

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof FirearmFormState | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

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
    }
  })

  const handleInputChange = (field: keyof FirearmFormState, value: any) => {
    setNewFirearm((prev: FirearmFormState) => ({ ...prev, [field]: value }))
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
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      const val = parseFloat(String(value));
      if (isNaN(val)) {
        errors.value = 'Must be a valid number.'
      }
    }
    if (purchase_price !== undefined && purchase_price !== null && String(purchase_price).trim() !== "") {
      // Allows for decimal numbers. Regex checks for optional leading digits, an optional decimal point, and optional trailing digits.
      // Ensures it's not just whitespace or an empty string if provided.
      if (!/^\d*\.?\d+$/.test(String(purchase_price).trim()) && !/^\d+\.?\d*$/.test(String(purchase_price).trim())) {
         if (String(purchase_price).trim() !== "") { // only error if not empty and invalid
            errors.purchase_price = 'Must be a valid price.';
         }
      } else {
        // Additional check for parseFloat if regex passes but could still be problematic (e.g. multiple decimal points if regex was less strict)
        const priceVal = parseFloat(String(purchase_price).trim());
        if (isNaN(priceVal)) {
             errors.purchase_price = 'Must be a valid price.';
        }
      }
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const { round_count } = newFirearm
    const errors: Partial<Record<keyof FirearmFormState, string>> = {}
    if (round_count !== undefined && round_count !== null && String(round_count).trim() !== "") {
      const count = parseInt(String(round_count), 10);
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
    if (!selectedImageBase64) { // Check if a base64 image is selected
      setFieldErrors(prev => ({ ...prev, image_base64: 'Image is required' }))
      imageError = true;
    } else {
      // Image is selected, make sure it's valid
      setFieldErrors(prev => ({ ...prev, image_base64: undefined }))
      console.log('Image base64 data is available (length):', selectedImageBase64.length)
    }

    if (imageError) {
      // If image error exists and we are not on step 4, navigate to step 4
      if (currentStep !== 4) setCurrentStep(4);
      return;
    }

    // Prepare the payload for the API - this should match CreateFirearmPayload
    const firearmToSave: CreateFirearmPayload = {
      // Required string fields
      name: newFirearm.name,
      type: newFirearm.type,
      serial_number: newFirearm.serial_number,

      // Optional string fields - send as plain string or undefined
      manufacturer: (newFirearm.manufacturer?.trim().toLowerCase() === 'sdf' || !newFirearm.manufacturer?.trim()) 
        ? undefined 
        : newFirearm.manufacturer.trim(),

      model_name: (newFirearm.model_name?.trim().toLowerCase() === 'sdf' || !newFirearm.model_name?.trim()) 
        ? undefined 
        : newFirearm.model_name.trim(),

      caliber: (newFirearm.caliber?.trim().toLowerCase() === 'sdf' || !newFirearm.caliber?.trim()) 
        ? undefined 
        : newFirearm.caliber.trim(),

      // For dates, send as ISO string or undefined
      acquisition_date: newFirearm.acquisition_date 
        ? (newFirearm.acquisition_date instanceof Date 
            ? newFirearm.acquisition_date.toISOString() 
            : typeof newFirearm.acquisition_date === 'string' && !isNaN(new Date(newFirearm.acquisition_date).getTime())
              ? new Date(newFirearm.acquisition_date).toISOString()
              : undefined)
        : undefined,

      // Purchase price as string or undefined
      purchase_price: (newFirearm.purchase_price?.trim().toLowerCase() === 'sdf' || !newFirearm.purchase_price?.trim()) 
        ? undefined 
        : String(newFirearm.purchase_price).trim(),

      ballistic_performance: (newFirearm.ballistic_performance?.trim().toLowerCase() === 'sdf' || !newFirearm.ballistic_performance?.trim()) 
        ? undefined 
        : newFirearm.ballistic_performance.trim(),

      image_base64: selectedImageBase64 || undefined, // Add base64 image
      image: undefined, // Explicitly set image URL to undefined as server will handle it

      // Numeric values - send as number or undefined
      round_count: newFirearm.round_count !== undefined && newFirearm.round_count !== null 
        ? parseInt(String(newFirearm.round_count), 10) 
        : undefined,

      value: newFirearm.value !== undefined && newFirearm.value !== null 
        ? parseFloat(String(newFirearm.value)) 
        : undefined,

      // Status as string or undefined
      status: (newFirearm.status?.trim().toLowerCase() === 'sdf' || !newFirearm.status?.trim()) 
        ? undefined 
        : newFirearm.status?.trim(),

      // Dates as ISO string or undefined
      last_fired: newFirearm.last_fired 
        ? (newFirearm.last_fired instanceof Date 
            ? newFirearm.last_fired.toISOString() 
            : typeof newFirearm.last_fired === 'string' && !isNaN(new Date(newFirearm.last_fired).getTime())
              ? new Date(newFirearm.last_fired).toISOString()
              : undefined)
        : undefined,

      last_cleaned: newFirearm.last_cleaned 
        ? (newFirearm.last_cleaned instanceof Date 
            ? newFirearm.last_cleaned.toISOString() 
            : typeof newFirearm.last_cleaned === 'string' && !isNaN(new Date(newFirearm.last_cleaned).getTime())
              ? new Date(newFirearm.last_cleaned).toISOString()
              : undefined)
        : undefined
    };

    console.log('AddFirearmDrawerContent: Saving firearm with payload:', JSON.stringify(firearmToSave, null, 2));

    // console.log('AddFirearmDrawerContent: Attempting to save firearm:', firearmToSave);
    // console.log('AddFirearmDrawerContent: Auth token:', token);

    // Call the store action to add the firearm
    // The store action should handle the API call
    const success = await addFirearm(firearmToSave, token); // Pass token and await

    if (success) {
      // console.log('AddFirearmDrawerContent: Firearm saved successfully');
      setNewFirearm(initialFirearmState); // Reset form
      setCurrentStep(1); // Reset to first step
      closeDrawer(); // Close the drawer
      // Optionally: Show a success message to the user (e.g., using a toast notification)
    } else {
      // console.error('AddFirearmDrawerContent: Failed to save firearm. Store error:', storeError);
      // Error is already set in the store by addFirearm action if API call failed.
      // You might want to show a generic error message here or rely on a global error display.
      // Alert.alert('Save Failed', storeError || 'Could not save firearm. Please try again.');
      // If storeError is specific and user-friendly, you can display it.
      // For now, we assume the store handles setting a displayable error message if needed.
      setFieldErrors(prev => ({ ...prev, formError: storeError || 'Failed to save firearm. Please check your connection or try again.' }))

    }
  }

  // Helper function to determine if a field is the last in its section for styling
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

  // Image Picker Logic
  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return false;
      }
      return true;
    }
    return true; // Permissions not typically needed on web for file input
  };

  const pickImageAsync = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Lower quality for faster uploads & less storage
      base64: true, // Request base64 data
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      setSelectedImageBase64(asset.base64 || null); 
      // Clear previous image URL error if any
      setFieldErrors(prev => ({ ...prev, image_base64: undefined }))
    } else {
      // Handle cancellation or no assets selected (optional)
      // setSelectedImageUri(null);
      // setSelectedImageBase64(null);
    }
  };

  // Constants for Select components
  const FIREARM_TYPES = [
    { label: 'Pistol', value: 'Pistol' },
    { label: 'Revolver', value: 'Revolver' },
    { label: 'Rifle', value: 'Rifle' },
    { label: 'Shotgun', value: 'Shotgun' },
    { label: 'Derringer', value: 'Derringer' },
    { label: 'Other', value: 'Other' }
  ]

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
              {renderDetailRow('Acquisition Date', 'acquisition_date', 'Select date', 'date')}
              {renderDetailRow('Purchase Price', 'purchase_price', 'e.g., 500.00', 'text', undefined, 'numeric')}
              {renderDetailRow('Current Value', 'value', 'e.g., 450.00', 'text', undefined, 'numeric')}
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
                <Button title="Select Image" onPress={pickImageAsync} variant="outline" style={{ marginBottom: 10 }} />
                {selectedImageUri && (
                  <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                )}
                {fieldErrors.image_base64 && (
                  <Text style={styles.errorText}>{fieldErrors.image_base64}</Text>
                )}
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
