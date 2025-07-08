import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  ActionSheetIOS,
  ActivityIndicator,
  Linking
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTheme, Text, Button, Select, Input } from '@team556/ui'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import { CreateDocumentPayload } from '@team556/ui'

// Constants for calculating progress bar width
const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DRAWER_HORIZONTAL_PADDING = 20 // From @team556/ui Drawer component's scrollContent
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20 // From local styles.headerGradient
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1 // From local styles.progressContainer

const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2

const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR

// Define a type for the form state that allows Date objects for date fields
// before they are converted to ISO strings for the API payload.
type DocumentFormState = Omit<
  CreateDocumentPayload,
  'issue_date' | 'expiration_date' | 'attachments'
> & {
  issue_date?: Date | string | undefined
  expiration_date?: Date | string | undefined
  attachments: string[]
}

const initialDocumentState: DocumentFormState = {
  name: '',
  type: '',
  issuing_authority: '',
  issue_date: undefined,
  expiration_date: undefined,
  document_number: '',
  notes: '',
  attachments: []
}

interface AddDocumentDrawerContentProps {
  closeDrawer: () => void;
}

const AddDocumentDrawerContent: React.FC<AddDocumentDrawerContentProps> = ({ closeDrawer }) => {
  const { colors } = useTheme();
  const { addDocument, isLoading, error: storeError } = useDocumentStore();
  const { token } = useAuthStore();
  
  const [newDocument, setNewDocument] = useState<DocumentFormState>(initialDocumentState);
  const [currentStep, setCurrentStep] = useState(1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DocumentFormState, string>>>({});

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 3],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH] // Use calculated numerical width
  })

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<keyof DocumentFormState | null>(null);
  const [currentDateValue, setCurrentDateValue] = useState(new Date());
  
  const steps = ['Document Details', 'Additional Info'];
  
  // Update progress bar animation when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep - 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false
    }).start();
  }, [currentStep]);

  const handleInputChange = (field: keyof DocumentFormState, value: any) => {
    setNewDocument(prev => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Specific handler for date changes from the picker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false) // Hide picker on any action
    if (event.type === 'set' && selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate)
    }
    setDatePickerField(null) // Reset the field being edited
  }

  const showMode = (fieldKey: keyof DocumentFormState) => {
    const fieldValue = newDocument[fieldKey]
    const initialPickerDate =
      fieldValue instanceof Date
        ? fieldValue
        : typeof fieldValue === 'string' && !isNaN(new Date(fieldValue).getTime())
          ? new Date(fieldValue)
          : new Date()

    setCurrentDateValue(initialPickerDate)
    setDatePickerField(fieldKey)
    setShowDatePicker(true)
  }
  
  const handleAddAttachment = async () => {
    const showActionSheet = () => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 1) {
            await takePhoto();
          } else if (buttonIndex === 2) {
            await chooseFromLibrary();
          }
        }
      );
    };

    const takePhoto = async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        const newAttachment = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setNewDocument(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment]
        }));
      }
    };

    const chooseFromLibrary = async () => {
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaLibraryPermission.granted) {
        Alert.alert('Permission needed', 'Media library permission is required to choose photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        const newAttachment = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setNewDocument(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment]
        }));
      }
    };

    if (Platform.OS === 'ios') {
      showActionSheet();
    } else {
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: chooseFromLibrary },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  }

  const validateStep1 = () => {
    const errors: Partial<Record<keyof DocumentFormState, string>> = {}
    
    if (!newDocument.name) {
      errors.name = 'Name is required'
    }
    
    if (!newDocument.type) {
      errors.type = 'Type is required'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const validateStep2 = () => {
    const errors: Partial<Record<keyof DocumentFormState, string>> = {}
    
    // Additional validation can be added here if needed
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleNextStep = () => {
    let isValid = false
    
    if (currentStep === 1) {
      isValid = validateStep1()
    } else if (currentStep === 2) {
      isValid = validateStep2()
    }
    
    if (isValid) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handleSubmit = useCallback(async () => {
    if (!validateStep1()) {
      return
    }

    const payload: CreateDocumentPayload = {
      name: newDocument.name,
      type: newDocument.type,
      issuing_authority: newDocument.issuing_authority || undefined,
      issue_date: newDocument.issue_date instanceof Date ? newDocument.issue_date.toISOString() : newDocument.issue_date,
      expiration_date: newDocument.expiration_date instanceof Date ? newDocument.expiration_date.toISOString() : newDocument.expiration_date,
      document_number: newDocument.document_number || undefined,
      notes: newDocument.notes || undefined,
      attachments: newDocument.attachments.length > 0 ? JSON.stringify(newDocument.attachments) : undefined,
    } as CreateDocumentPayload;

    const success = await addDocument(payload, token);
    if (success) {
      closeDrawer();
    }
  }, [newDocument, addDocument, token, closeDrawer, validateStep1]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: DRAWER_PADDING,
    },
    stepIndicator: {
      width: '100%',
      height: 4,
      backgroundColor: '#E9E9E9',
      borderRadius: 2,
      marginBottom: 15,
      marginTop: 5,
    },
    progressBar: {
      height: 4,
      backgroundColor: '#805AD5',
      borderRadius: 2,
    },
    stepText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    title: {
      marginLeft: 8,
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      marginBottom: 6,
      color: colors.text,
      fontWeight: '500',
    },
    inputError: {
      color: '#E53E3E', // Error red
      fontSize: 12,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.card,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    datePickerText: {
      color: colors.text,
    },
    attachmentsContainer: {
      marginTop: 20,
      marginBottom: 10,
    },
    attachmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    attachmentLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    attachmentsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    attachmentItem: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    attachmentImage: {
      width: '100%',
      height: '100%',
    },
    removeButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      marginTop: 'auto',
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    primaryButton: {
      backgroundColor: '#805AD5', // Purple from FirearmsView
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#805AD5',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: '#805AD5',
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
      margin: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 25,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '90%',
    },
  });

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Name*</Text>
        <Input
          value={newDocument.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Document Name"
          placeholderTextColor={colors.text + '80'}
          style={[styles.input, fieldErrors.name ? { borderColor: '#E53E3E' } : null]}
        />
        {fieldErrors.name && <Text style={styles.inputError}>{fieldErrors.name}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Type*</Text>
        <Select
          value={newDocument.type}
          onValueChange={(value) => handleInputChange('type', value)}
          items={[
            { label: 'Identification', value: 'Identification' },
            { label: 'License', value: 'License' },
            { label: 'Certificate', value: 'Certificate' },
            { label: 'Receipt', value: 'Receipt' },
            { label: 'Other', value: 'Other' },
          ]}
          style={[styles.input, fieldErrors.type ? { borderColor: '#E53E3E' } : null]}
        />
        {fieldErrors.type && <Text style={styles.inputError}>{fieldErrors.type}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Issuing Authority</Text>
        <Input
          value={newDocument.issuing_authority}
          onChangeText={(value) => handleInputChange('issuing_authority', value)}
          placeholder="Issuing Authority"
          placeholderTextColor={colors.text + '80'}
          style={styles.input}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Issue Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => showMode('issue_date')}
        >
          <Text style={styles.datePickerText}>
            {newDocument.issue_date
              ? newDocument.issue_date instanceof Date
                ? newDocument.issue_date.toLocaleDateString()
                : new Date(newDocument.issue_date).toLocaleDateString()
              : 'Select date'}
          </Text>
          <MaterialCommunityIcons name="calendar" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Expiration Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => showMode('expiration_date')}
        >
          <Text style={styles.datePickerText}>
            {newDocument.expiration_date
              ? newDocument.expiration_date instanceof Date
                ? newDocument.expiration_date.toLocaleDateString()
                : new Date(newDocument.expiration_date).toLocaleDateString()
              : 'Select date'}
          </Text>
          <MaterialCommunityIcons name="calendar" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Document Number</Text>
        <Input
          value={newDocument.document_number}
          onChangeText={(value) => handleInputChange('document_number', value)}
          placeholder="Document Number"
          placeholderTextColor={colors.text + '80'}
          style={styles.input}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Notes</Text>
        <Input
          value={newDocument.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Notes"
          placeholderTextColor={colors.text + '80'}
          style={[styles.input, { height: 80 }]}
          multiline
        />
      </View>
      
      <View style={styles.attachmentsContainer}>
        <View style={styles.attachmentHeader}>
          <Text style={styles.attachmentLabel}>Attachments</Text>
          <TouchableOpacity onPress={handleAddAttachment}>
            <Ionicons name="add-circle" size={24} color={"#805AD5"} />
          </TouchableOpacity>
        </View>
        <View style={styles.attachmentsList}>
          {newDocument.attachments.map((uri: string, index: number) => (
            <View key={index} style={styles.attachmentItem}>
              <Image source={{ uri }} style={styles.attachmentImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const updatedAttachments = [...newDocument.attachments];
                  updatedAttachments.splice(index, 1);
                  handleInputChange('attachments', updatedAttachments);
                }}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={24} color={colors.text} />
        <Text style={styles.title}>Add Document</Text>
      </View>
      
      {/* Step indicator */}
      <Text style={styles.stepText}>{steps[currentStep - 1]} ({currentStep}/{steps.length})</Text>
      <View style={styles.stepIndicator}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: animatedProgressWidth },
          ]}
        />
      </View>
      
      {/* Form steps */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      
      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setCurrentStep(currentStep - 1)}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={closeDrawer}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < steps.length ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNextStep}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Save Document</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          visible={showDatePicker}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <DateTimePicker
                value={currentDateValue}
                mode="date"
                display="spinner"
                onChange={onDateChange}
              />
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { marginTop: 15, width: '100%' }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Error notification if needed */}
      {storeError && (
        <View style={{ marginBottom: 10, padding: 8, backgroundColor: '#FED7D7', borderRadius: 4 }}>
          <Text style={{ color: '#9B2C2C' }}>{storeError}</Text>
        </View>
      )}
    </View>
  );
};

export default AddDocumentDrawerContent;
