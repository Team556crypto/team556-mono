import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity
} from 'react-native';
import { Text, useTheme, Button, Select, Input } from '@team556/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { CreateNFAPayload, nfaTypeOptions, taxStampTypeOptions } from '@/services/api';
import { useNFAStore } from '@/store/nfaStore';
import { useAuthStore } from '@/store/authStore';
import { useDrawerStore } from '@/store/drawerStore';

type NFAFormState = Omit<CreateNFAPayload, 'tax_stamp_submission_date' | 'tax_stamp_approval_date'> & {
  tax_stamp_submission_date?: Date | string | undefined;
  tax_stamp_approval_date?: Date | string | undefined;
};

const initialState: NFAFormState = {
  manufacturer: '',
  model_name: '',
  caliber: '',
  type: '',
  tax_stamp_id_number: '',
  tax_stamp_type: '',
  tax_stamp_submission_date: undefined,
  tax_stamp_approval_date: undefined,
  value: 0,
  round_count: 0,
  picture_base64: undefined,
};

export const AddNFADrawerContent = () => {
  const { colors } = useTheme();
  const { addNFAItem, isLoading, error: storeError } = useNFAStore();
  const token = useAuthStore(state => state.token);
    const { closeDrawer } = useDrawerStore();

  const styles = StyleSheet.create({
    label: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    errorText: {
      color: colors.error,
      marginTop: 4,
    },
  });

  const [formState, setFormState] = useState<NFAFormState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NFAFormState, string>>>({});
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const steps = ['Core Details', 'Tax Stamp Info', 'Additional Details'];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<keyof NFAFormState | null>(null);

  const handleInputChange = (field: keyof NFAFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate);
    }
  };

  const showDatepicker = (field: keyof NFAFormState) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const validateStep = () => {
    const errors: Partial<Record<keyof NFAFormState, string>> = {};
    if (currentStep === 1) {
      if (!formState.manufacturer) errors.manufacturer = 'Manufacturer is required';
      if (!formState.model_name) errors.model_name = 'Model is required';
      if (!formState.caliber) errors.caliber = 'Caliber is required';
      if (!formState.type) errors.type = 'Type is required';
    } else if (currentStep === 2) {
      if (!formState.tax_stamp_id_number) errors.tax_stamp_id_number = 'Tax Stamp ID is required';
      if (!formState.tax_stamp_type) errors.tax_stamp_type = 'Tax Stamp Type is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSave = async () => {
    if (!validateStep()) return;

        let picture_base64: string | undefined;
    if (selectedImageUri) {
      const manipResult = await manipulateAsync(
        selectedImageUri,
        [],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );
      picture_base64 = `data:image/jpeg;base64,${manipResult.base64}`;
    }

    const payload: CreateNFAPayload = {
      ...formState,
      tax_stamp_submission_date: formState.tax_stamp_submission_date instanceof Date ? formState.tax_stamp_submission_date.toISOString() : undefined,
      tax_stamp_approval_date: formState.tax_stamp_approval_date instanceof Date ? formState.tax_stamp_approval_date.toISOString() : undefined,
      picture_base64
    };

    const success = await addNFAItem(payload, token);
    if (success) {
      closeDrawer();
    }
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    } else {
      alert('You did not select any image.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Input label="Manufacturer" value={formState.manufacturer} onChangeText={text => handleInputChange('manufacturer', text)} error={fieldErrors.manufacturer} />
            <Input label="Model" value={formState.model_name} onChangeText={text => handleInputChange('model_name', text)} error={fieldErrors.model_name} />
            <Input label="Caliber" value={formState.caliber} onChangeText={text => handleInputChange('caliber', text)} error={fieldErrors.caliber} />
                                    <View>
              <Text style={styles.label}>Type</Text>
              <Select<string> items={nfaTypeOptions} onValueChange={value => handleInputChange('type', value)} selectedValue={formState.type} placeholder="Select NFA Type" headerTitle="Select NFA Type" />
              {fieldErrors.type && <Text style={styles.errorText}>{fieldErrors.type}</Text>}
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Input label="Tax Stamp ID" value={formState.tax_stamp_id_number} onChangeText={text => handleInputChange('tax_stamp_id_number', text)} error={fieldErrors.tax_stamp_id_number} />
                                    <View>
              <Text style={styles.label}>Tax Stamp Type</Text>
              <Select<string> items={taxStampTypeOptions} onValueChange={value => handleInputChange('tax_stamp_type', value)} selectedValue={formState.tax_stamp_type} placeholder="Select Tax Stamp Type" headerTitle="Select Tax Stamp Type" />
              {fieldErrors.tax_stamp_type && <Text style={styles.errorText}>{fieldErrors.tax_stamp_type}</Text>}
            </View>
            <TouchableOpacity onPress={() => showDatepicker('tax_stamp_submission_date')}><Input label="Submission Date" value={formState.tax_stamp_submission_date instanceof Date ? formState.tax_stamp_submission_date.toLocaleDateString() : ''} editable={false} /></TouchableOpacity>
            <TouchableOpacity onPress={() => showDatepicker('tax_stamp_approval_date')}><Input label="Approval Date" value={formState.tax_stamp_approval_date instanceof Date ? formState.tax_stamp_approval_date.toLocaleDateString() : ''} editable={false} /></TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View>
            <Input label="Value" value={String(formState.value)} onChangeText={text => handleInputChange('value', Number(text))} keyboardType="numeric" />
            <Input label="Round Count" value={String(formState.round_count)} onChangeText={text => handleInputChange('round_count', Number(text))} keyboardType="numeric" />
            <Button title="Select Image" onPress={pickImageAsync} />
            {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={{ width: 100, height: 100, alignSelf: 'center', marginVertical: 10 }} />}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text preset="h3">Add NFA Item</Text>
        <Text>{steps[currentStep - 1]}</Text>
      </View>

      {renderStepContent()}

      {storeError && <Text style={{ color: colors.error, textAlign: 'center', marginVertical: 10 }}>{storeError}</Text>}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        {currentStep > 1 && <Button title="Previous" onPress={() => setCurrentStep(prev => prev - 1)} variant="outline" />}
        {currentStep < steps.length ? (
          <Button title="Next" onPress={handleNextStep} />
        ) : (
          <Button title={isLoading ? 'Saving...' : 'Save'} onPress={handleSave} disabled={isLoading} />
        )}
      </View>

      <Button title="Cancel" onPress={closeDrawer} variant="ghost" style={{ marginTop: 12 }} />

      {showDatePicker && (
                <DateTimePicker
          value={datePickerField && formState[datePickerField] instanceof Date ? formState[datePickerField] as Date : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </ScrollView>
  );
};
