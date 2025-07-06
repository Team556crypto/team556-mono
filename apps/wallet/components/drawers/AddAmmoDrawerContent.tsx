import React, { useState, useEffect, useRef } from 'react';
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
  ActionSheetIOS,
} from 'react-native';
import { Text, useTheme, Button } from '@team556/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { CreateAmmoPayload } from '@/services/api';
import { useAmmoStore } from '@/store/ammoStore';
import { useAuthStore } from '@/store/authStore';
import { useDrawerStore } from '@/store/drawerStore';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 }; // Fallback to black
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DRAWER_HORIZONTAL_PADDING = 20;
const HEADER_GRADIENT_HORIZONTAL_PADDING = 20;
const PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING = 1;

const TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR =
  DRAWER_HORIZONTAL_PADDING * 2 + HEADER_GRADIENT_HORIZONTAL_PADDING * 2 + PROGRESS_CONTAINER_OWN_HORIZONTAL_PADDING * 2;

const PROGRESS_BAR_RENDER_WIDTH = SCREEN_WIDTH - TOTAL_HORIZONTAL_PADDING_FOR_PROGRESS_BAR;

// This type handles the form state, which might have strings for number fields initially
type AmmoFormState = Omit<CreateAmmoPayload, 'quantity' | 'purchasePrice' | 'pictures' | 'purchaseDate'> & {
  quantity: string;
  purchasePrice: string;
  purchaseDate?: string;
  pictures: string[]; // Array of base64 strings
};

const initialAmmoState: AmmoFormState = {
  manufacturer: '',
  caliber: '',
  type: '',
  quantity: '',
  grainWeight: '',
  purchaseDate: undefined,
  purchasePrice: '',
  notes: '',
  pictures: []
};

export const AddAmmoDrawerContent = () => {
  const { colors } = useTheme();
  const { addAmmo, isLoading, error: storeError } = useAmmoStore();
  const { token } = useAuthStore();
  const { closeDrawer } = useDrawerStore();

  const [newAmmo, setNewAmmo] = useState<AmmoFormState>(initialAmmoState);
  const [currentStep, setCurrentStep] = useState(1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AmmoFormState, string>>>({});

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 2],
    outputRange: [0, PROGRESS_BAR_RENDER_WIDTH]
  });

  const steps = ['Details', 'Purchase Info', 'Notes & Photos'];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<keyof AmmoFormState | null>(null);
  const [currentDateValue, setCurrentDateValue] = useState(new Date());

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 26,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 8,
      color: colors.text,
    },
    stepContainer: {
      paddingHorizontal: 20,
    },
    detailRow: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 8,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    inputContainer: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
      minHeight: 50,
      borderColor: colors.backgroundLight,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 50,
      color: colors.text,
      borderColor: colors.backgroundLight,
    },
    inputText: {
      fontSize: 16,
      color: colors.text,
    },
    errorText: {
      color: 'red',
      marginTop: 4,
    },
    stepButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 20,
    },
    buttonHalfWidth: {
      width: '48%',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    datePickerContainer: {
      borderRadius: 14,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      backgroundColor: colors.backgroundCard,
      borderWidth: 1,
      borderColor: `rgba(${hexToRgb(colors.primary).r}, ${hexToRgb(colors.primary).g}, ${hexToRgb(colors.primary).b}, 0.5)`,
    },
    datePickerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text,
    },
    datePickerContent: {
      marginBottom: 20,
    },
    datePickerActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    thumbnail: {
      width: 80,
      height: 80,
      borderRadius: 10,
      marginRight: 10,
    },
  });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start();
  }, [currentStep]);

  const handleInputChange = (field: keyof AmmoFormState, value: any) => {
    setNewAmmo(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || currentDateValue;
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && datePickerField) {
      handleInputChange(datePickerField, currentDate.toISOString().split('T')[0]);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const showMode = (fieldKey: keyof AmmoFormState) => {
    setDatePickerField(fieldKey);
    const dateValue = newAmmo[fieldKey];
    const initialDate = dateValue && typeof dateValue === 'string' ? new Date(dateValue) : new Date();
    setCurrentDateValue(isNaN(initialDate.getTime()) ? new Date() : initialDate);
    setShowDatePicker(true);
  };

  const validateStep = () => {
    const errors: Partial<Record<keyof AmmoFormState, string>> = {};
    if (currentStep === 1) {
      if (!newAmmo.manufacturer) errors.manufacturer = 'Manufacturer is required';
      if (!newAmmo.caliber) errors.caliber = 'Caliber is required';
      if (!newAmmo.type) errors.type = 'Type is required';
      const quantityNum = parseInt(newAmmo.quantity, 10);
      if (isNaN(quantityNum) || quantityNum <= 0) errors.quantity = 'Must be > 0';
      if (!newAmmo.grainWeight) errors.grainWeight = 'Grain weight is required';
    }
    // Add validation for other steps if needed
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSaveAmmo = async () => {
    if (!validateStep()) return;

    if (!token) {
      setFieldErrors({ manufacturer: 'Authentication token is missing.' });
      return;
    }

    const payload: CreateAmmoPayload = {
      ...newAmmo,
      quantity: parseInt(newAmmo.quantity, 10),
      purchasePrice: newAmmo.purchasePrice ? parseFloat(newAmmo.purchasePrice) : undefined,
      purchaseDate: newAmmo.purchaseDate ? new Date(newAmmo.purchaseDate).toISOString() : undefined,
      pictures: JSON.stringify(newAmmo.pictures)
    };

    const success = await addAmmo(payload, token);
    if (success) {
      closeDrawer();
    }
  };

  const requestMediaLibraryPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return false;
    }

    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaLibraryPermission.status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Choose from Library'],
        cancelButtonIndex: 0,
      },
      (buttonIndex: number) => {
        if (buttonIndex === 1) {
          takePhoto();
        } else if (buttonIndex === 2) {
          selectFromGallery();
        }
      }
    );
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNewAmmo(prev => ({ ...prev, pictures: [...prev.pictures, base64] }));
    }
  };

  const selectFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNewAmmo(prev => ({ ...prev, pictures: [...prev.pictures, base64] }));
    }
  };

  const renderDetailRow = (
    label: string,
    field: keyof AmmoFormState,
    placeholder: string,
    inputType: 'text' | 'date' = 'text',
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => (
    <View style={styles.detailRow}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {inputType === 'date' ? (
        <TouchableOpacity onPress={() => showMode(field)}>
          <View style={[styles.inputContainer, { borderColor: colors.backgroundLight }]}>
            <Text style={[styles.inputText, { color: colors.text }]}>
              {newAmmo[field] ? new Date(newAmmo[field] as string).toLocaleDateString() : placeholder}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.backgroundLight }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={newAmmo[field] as string}
          onChangeText={text => handleInputChange(field, text)}
          keyboardType={keyboardType}
        />
      )}
      {fieldErrors[field] && <Text style={styles.errorText}>{fieldErrors[field]}</Text>}
    </View>
  );

  return (
    <React.Fragment>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name='ammunition' size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Add Ammunition</Text>
        </View>

        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            {renderDetailRow('Manufacturer', 'manufacturer', 'e.g., Federal')}
            {renderDetailRow('Caliber', 'caliber', 'e.g., 9mm')}
            {renderDetailRow('Type', 'type', 'e.g., FMJ')}
            {renderDetailRow('Quantity', 'quantity', 'e.g., 50', 'text', 'numeric')}
            {renderDetailRow('Grain Weight', 'grainWeight', 'e.g., 115gr')}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            {renderDetailRow('Purchase Date', 'purchaseDate', 'Select a date', 'date')}
            {renderDetailRow('Purchase Price', 'purchasePrice', 'e.g., 19.99', 'text', 'numeric')}
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            {renderDetailRow('Notes', 'notes', 'e.g., Range ammo')}
            <Button title='Add Photos' onPress={pickImage} />
            <View style={styles.imageGrid}>
              {newAmmo.pictures.map((uri: string, index: number) => (
                <Image key={index} source={{ uri }} style={styles.thumbnail} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.stepButtonContainer}>
          {currentStep > 1 && (
            <Button
              title='Previous'
              onPress={() => setCurrentStep(currentStep - 1)}
              variant='outline'
              style={styles.buttonHalfWidth}
            />
          )}
          {currentStep < steps.length ? (
            <Button title='Next' onPress={handleNextStep} variant='primary' style={styles.buttonHalfWidth} />
          ) : (
            <Button title={isLoading ? 'Saving...' : 'Save Ammo'} onPress={handleSaveAmmo} variant='primary' style={styles.buttonHalfWidth} />
          )}
        </View>

        {storeError && <Text style={styles.errorText}>{storeError}</Text>}
      </ScrollView>

      {showDatePicker && (
        <Modal
          transparent={true}
          animationType='fade'
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
            setDatePickerField(null);
          }}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => {
              setShowDatePicker(false);
              setDatePickerField(null);
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.backgroundCard }]}>
                <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date</Text>
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    testID='dateTimePicker'
                    value={currentDateValue}
                    mode={'date'}
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    textColor={colors.text}
                    accentColor={colors.primary}
                  />
                </View>

                <View style={styles.datePickerActions}>
                  <Button
                    title='Cancel'
                    onPress={() => {
                      setShowDatePicker(false);
                      setDatePickerField(null);
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
  );
};

export default AddAmmoDrawerContent;
