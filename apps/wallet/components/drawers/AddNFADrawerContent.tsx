import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Platform, 
  TextInput, 
  Modal, 
  Animated, 
  Dimensions, 
  Alert,
  KeyboardTypeOptions
} from 'react-native';
import { useNFAStore } from '@/store/nfaStore';
import { useDrawerStore } from '@/store/drawerStore';
import { Button, Text, Select, useTheme } from '@team556/ui';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CreateNFAPayload, nfaTypeOptions, taxStampTypeOptions } from '@/services/api';

// Screen dimensions for calculating progress bar
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR = 32; // 16px padding on each side
const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR;

// Define the form state type with string values for the form that will be converted to numbers for the API payload
type NFAFormState = {
  serial: string;
  manufacturer: string;
  model: string;
  caliber: string;
  nfaType: string;
  additionalInfo: string;
  tax_stamp_submission_date: string;
  tax_stamp_approval_date: string;
  taxStampType: string;
  taxStampNumber: string;
  value: string;
  round_count: string;
  images: string[];
};

const initialState: NFAFormState = {
  serial: '',
  manufacturer: '',
  model: '',
  caliber: '',
  nfaType: '',
  additionalInfo: '',
  tax_stamp_submission_date: '',
  tax_stamp_approval_date: '',
  taxStampType: '',
  taxStampNumber: '',
  value: '0',
  round_count: '0',
  images: [],
};

const AddNFADrawerContent = () => {
  const { colors } = useTheme();
  const { addNFAItem, isLoading, error: storeError } = useNFAStore();
  const { token } = useAuthStore();
  const { closeDrawer } = useDrawerStore();

  const [formState, setFormState] = useState<NFAFormState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NFAFormState, string>>>({});

  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Step progress animation
  const steps = ['NFA Details', 'Tax Stamp Info', 'Additional Info'];
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<keyof NFAFormState | null>(null);
  const [currentDateValue, setCurrentDateValue] = useState<Date>(new Date());

  // State for image
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  
  // Animate progress bar when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep - 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  // Handle input changes
  const handleInputChange = (field: keyof NFAFormState, value: string | number | boolean | null) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear any error for this field when it's edited
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // DatePicker modal date functions
  const showMode = (fieldKey: keyof NFAFormState) => {
    const fieldValue = formState[fieldKey] as string;
    const initialDate =
      typeof fieldValue === 'string' && fieldValue && !isNaN(new Date(fieldValue).getTime())
        ? new Date(fieldValue)
        : new Date();

    setCurrentDateValue(initialDate);
    setDatePickerField(fieldKey);
    setShowDatePicker(true);
  };

  // Handle confirming a date selection
  const handleConfirmDate = () => {
    if (datePickerField && currentDateValue) {
      // Update form state with ISO string when confirming
      handleInputChange(datePickerField, currentDateValue.toISOString());
    }
    setShowDatePicker(false); // Close the modal
    setDatePickerField(null); // Reset the field being edited
  };

  // Handle canceling a date selection
  const handleCancelDate = () => {
    setShowDatePicker(false); // Close the modal without updating state
    setDatePickerField(null); // Reset the field being edited
  };

  // Function to parse dates for the picker
  const getDateForPicker = (value: string | Date | undefined): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Function to render form detail rows with consistent styling
  const renderDetailRow = (
    label: string,
    field: keyof NFAFormState,
    placeholder: string,
    inputType: 'text' | 'date' | 'select' = 'text',
    items?: Array<{ label: string; value: string | number }>,
    keyboardType: KeyboardTypeOptions = 'default'
  ) => {
    const fieldValue = formState[field];
    const error = fieldErrors[field];

    let inputComponent: React.ReactNode = null;

    if (inputType === 'date') {
      // Date input display formatting
      const displayValue = fieldValue
        ? fieldValue instanceof Date
          ? (fieldValue as Date).toLocaleDateString()
          : typeof fieldValue === 'string' && new Date(fieldValue).toString() !== 'Invalid Date'
            ? new Date(fieldValue as string).toLocaleDateString()
            : placeholder
        : placeholder;

      inputComponent = (
        <TouchableOpacity onPress={() => showMode(field)} style={styles.dateContainer}>
          <Text style={[styles.dateText, fieldValue ? {} : styles.placeholderText]}>{displayValue}</Text>
          <MaterialCommunityIcons name="calendar" size={20} color="#6C63FF" style={styles.calendarIcon} />
        </TouchableOpacity>
      );
    } else if (inputType === 'select') {
      // Select dropdown
      inputComponent = (
        <View style={styles.selectContainer}>
          <Select
            items={items || []}
            selectedValue={fieldValue as string | number | undefined}
            onValueChange={value => handleInputChange(field, value)}
            placeholder={placeholder}
            style={{
              selectButton: styles.selectButton,
              selectButtonText: fieldValue ? styles.selectButtonText : styles.selectPlaceholderText,
              arrow: {
                color: '#6C63FF',
                fontSize: 14
              },
              modalContent: {
                backgroundColor: '#1B1F2F',
                borderColor: '#6C63FF',
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 8
              },
              modalItem: {
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomColor: 'rgba(108, 99, 255, 0.2)'
              },
              modalItemText: {
                fontSize: 15,
                color: '#fff'
              },
              modalOverlay: {
                backgroundColor: 'rgba(0,0,0,0.8)'
              }
            }}
          />
        </View>
      );
    } else {
      // Regular text input
      inputComponent = (
        <TextInput
          style={styles.fieldInput}
          value={typeof fieldValue === 'number' ? String(fieldValue) : fieldValue as string}
          onChangeText={(text: string) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType={keyboardType}
        />
      );
    }

    return (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {inputComponent}
        {error && <Text style={styles.errorTextBelow}>{error}</Text>}
      </View>
    );
  };

  // Function to handle image picking
  const pickImageAsync = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUploading(true);
        setImageError(null);
        
        // Compress the image
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        setSelectedImageUri(manipResult.uri);
        handleInputChange('images', [base64]);
        setImageUploading(false);
      }
    } catch (error) {
      console.error('Error picking or processing image:', error);
      setImageError('Failed to process image');
      setImageUploading(false);
    }
  };

  // Validate form fields for the current step
  const validateCurrentStep = () => {
    const errors: Partial<Record<keyof NFAFormState, string>> = {};
    
    if (currentStep === 1) {
      // Validate Step 1: Basic NFA details
      if (!formState.manufacturer) errors.manufacturer = 'Manufacturer is required';
      if (!formState.model) errors.model = 'Model is required';
      if (!formState.serial) errors.serial = 'Serial number is required';
      if (!formState.caliber) errors.caliber = 'Caliber is required';
      if (!formState.nfaType) errors.nfaType = 'NFA type is required';
    } else if (currentStep === 2) {
      // Validate Step 2: Tax stamp details
      if (!formState.taxStampType) errors.taxStampType = 'Tax stamp type is required';
      if (!formState.taxStampNumber) errors.taxStampNumber = 'Tax stamp number is required';
      if (!formState.tax_stamp_submission_date) errors.tax_stamp_submission_date = 'Submission date is required';
      if (!formState.tax_stamp_approval_date) errors.tax_stamp_approval_date = 'Approval date is required';
    } else if (currentStep === 3) {
      // Validate Step 3: Additional info
      if (!formState.value) errors.value = 'Value is required';
      if (!formState.round_count) errors.round_count = 'Round count is required';
      if (formState.images.length === 0) errors.images = 'At least one image is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSaveNFA = async () => {
    if (validateCurrentStep()) {
      try {
        // Prepare payload with correct types
        const payload: CreateNFAPayload = {
          model_name: formState.model,
          type: formState.nfaType,
          manufacturer: formState.manufacturer,
          caliber: formState.caliber,
          serial: formState.serial,
          value: parseFloat(formState.value),
          round_count: parseInt(formState.round_count, 10),
          additionalInfo: formState.additionalInfo,
          tax_stamp_submission_date: formState.tax_stamp_submission_date,
          tax_stamp_approval_date: formState.tax_stamp_approval_date,
          tax_stamp_type: formState.taxStampType,
          tax_stamp_id_number: formState.taxStampNumber,
          picture_base64: formState.images[0] || '',
        };

        await addNFAItem(payload, token);
        closeDrawer();
      } catch (error) {
        console.error('Error saving NFA:', error);
        Alert.alert('Error', 'Failed to save NFA item.');
      }
    }
  };

  // Render content for each step
  const renderStepContent = () => {
    const animatedProgressWidth = progressAnim.interpolate({
      inputRange: [0, steps.length - 1],
      outputRange: ['33%', '100%'],
    });

    switch (currentStep) {
      case 1:
        return (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>NFA Details</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Serial Number', 'serial', 'Enter serial number')}
              {renderDetailRow('Manufacturer', 'manufacturer', 'Enter manufacturer')}
              {renderDetailRow('Model', 'model', 'Enter model')}
              {renderDetailRow('Caliber', 'caliber', 'Enter caliber')}
              {renderDetailRow('Type', 'nfaType', 'Select NFA type', 'select', nfaTypeOptions)}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Tax Stamp Information</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Tax Stamp Type', 'taxStampType', 'Select tax stamp type', 'select', taxStampTypeOptions)}
              {renderDetailRow('Tax Stamp Number', 'taxStampNumber', 'Enter tax stamp number')}
              {renderDetailRow('Submission Date', 'tax_stamp_submission_date', 'Select date', 'date')}
              {renderDetailRow('Approval Date', 'tax_stamp_approval_date', 'Select date', 'date')}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            <View style={styles.sectionContent}>
              {renderDetailRow('Value', 'value', 'Enter value', 'text', undefined, 'numeric')}
              {renderDetailRow('Round Count', 'round_count', 'Enter round count', 'text', undefined, 'numeric')}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>NFA Image</Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Button 
                    title='Select Image' 
                    onPress={pickImageAsync} 
                    variant='outline' 
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>
              {selectedImageUri && (
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                </View>
              )}
              {fieldErrors.images && <Text style={styles.errorTextBelow}>{fieldErrors.images}</Text>}
              {renderDetailRow('Additional Info', 'additionalInfo', 'Enter additional information (optional)')}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <ScrollView style={styles.container} keyboardShouldPersistTaps='handled'>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name="shield"
                size={48}
                color="#6C63FF"
              />
            </View>
            <Text style={styles.title}>Add New NFA Item</Text>
            <Text style={styles.subtitle}>Enter the details below to add a new NFA item to your collection</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: animatedProgressWidth }]} />
        </View>

        {renderStepContent()}

        {storeError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name='alert-circle' size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>Error: {storeError}</Text>
          </View>
        )}

        <View style={styles.stepButtonContainer}>
          {currentStep > 1 ? (
            <Button
              title='Previous'
              onPress={handlePrevStep}
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
              title={isLoading ? 'Adding...' : 'Add NFA Item'}
              onPress={handleSaveNFA}
              disabled={isLoading}
              variant='primary'
            />
            <Button title='Cancel' onPress={closeDrawer} variant='ghost' style={{ marginTop: 12 }} />
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={handleCancelDate}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={handleCancelDate}
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
                    onChange={(event, date) => {
                      if (date) setCurrentDateValue(date);
                    }}
                    themeVariant='dark'
                    textColor="#FFFFFF"
                    accentColor="#6C63FF"
                  />
                </View>

                <View style={styles.datePickerActions}>
                  <Button
                    title='Cancel'
                    onPress={handleCancelDate}
                    variant='ghost'
                    style={{ marginRight: 8 }}
                  />
                  <Button
                    title='Confirm'
                    onPress={handleConfirmDate}
                    variant='primary'
                  />
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
    paddingHorizontal: 16
  },
  headerContainer: {
    marginBottom: 24
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 16
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 24,
    marginHorizontal: 0
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 2
  },
  sectionWrapper: {
    backgroundColor: 'transparent',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 0
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4
  },
  sectionContent: {
    paddingHorizontal: 0
  },
  // Form field styles
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  fieldInput: {
    flex: 1.5,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 33, 50, 1)',
    color: '#fff',
  },
  selectContainer: {
    flex: 1.5,
  },
  selectButton: {
    backgroundColor: 'rgba(30, 33, 50, 1)',
    borderWidth: 0,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  selectPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
  },
  dateContainer: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 33, 50, 1)',
  },
  dateText: {
    color: '#fff',
    fontSize: 15
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)'
  },
  calendarIcon: {
    marginLeft: 'auto'
  },
  errorTextBelow: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    paddingLeft: 4
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  stepButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonHalfWidth: {
    flex: 1,
    marginHorizontal: 4
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 8
  },
  // Date picker modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  datePickerContainer: {
    backgroundColor: '#1B1F2F',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)'
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16
  },
  datePickerContent: {
    marginBottom: 16
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
});

export default AddNFADrawerContent;
