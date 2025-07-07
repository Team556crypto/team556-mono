import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image
} from 'react-native';
import { Text, useTheme, Button, Select, Input } from '@team556/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { NFA, UpdateNFAPayload, nfaTypeOptions, taxStampTypeOptions } from '@/services/api';
import { useNFAStore } from '@/store/nfaStore';
import { useAuthStore } from '@/store/authStore';
import { useDrawerStore } from '@/store/drawerStore';

interface NFADetailsDrawerContentProps {
  nfaItem: NFA;
}

type EditableNFA = Omit<UpdateNFAPayload, 'tax_stamp_submission_date' | 'tax_stamp_approval_date'> & {
  tax_stamp_submission_date?: Date | string | undefined;
  tax_stamp_approval_date?: Date | string | undefined;
  picture_base64?: string;
};

export const NFADetailsDrawerContent: React.FC<NFADetailsDrawerContentProps> = ({ nfaItem }) => {
  const { colors } = useTheme();
  
  const { updateNFAItem, isLoading, error: storeError } = useNFAStore();
  const token = useAuthStore(state => state.token);
  const { closeDrawer } = useDrawerStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<EditableNFA>({ ...nfaItem });
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(nfaItem.picture || null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<keyof EditableNFA | null>(null);

  const handleInputChange = (field: keyof EditableNFA, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate);
    }
  };

  const showDatepicker = (field: keyof EditableNFA) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleSave = async () => {
        let picture_base64: string | undefined;
    if (selectedImageUri && selectedImageUri !== nfaItem.picture) {
      const manipResult = await manipulateAsync(
        selectedImageUri,
        [],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );
      picture_base64 = `data:image/jpeg;base64,${manipResult.base64}`;
    }

    const payload: UpdateNFAPayload = {
      ...formState,
      id: nfaItem.id,
      tax_stamp_submission_date: formState.tax_stamp_submission_date instanceof Date ? formState.tax_stamp_submission_date.toISOString() : formState.tax_stamp_submission_date,
      tax_stamp_approval_date: formState.tax_stamp_approval_date instanceof Date ? formState.tax_stamp_approval_date.toISOString() : formState.tax_stamp_approval_date,
      picture_base64
    };

    await updateNFAItem(nfaItem.id, payload, token);
    if (!storeError) {
      setIsEditing(false);
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

      const renderDetailRow = (label: string, value: string | number | undefined | null) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{String(value ?? 'N/A')}</Text>
    </View>
  );

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

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
    container: { flex: 1, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formContainer: { gap: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.textTertiary },
    detailLabel: { fontSize: 16, color: colors.textSecondary },
    detailValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    imagePreview: { width: '100%', height: 200, borderRadius: 8, marginVertical: 10 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text preset="h3">{nfaItem.manufacturer} {nfaItem.model_name}</Text>
        {!isEditing && <Button title="Edit" onPress={() => setIsEditing(true)} />}
      </View>

      {isEditing ? (
        <View style={styles.formContainer}>
          <Input label="Manufacturer" value={formState.manufacturer} onChangeText={text => handleInputChange('manufacturer', text)} />
          <Input label="Model" value={formState.model_name} onChangeText={text => handleInputChange('model_name', text)} />
          <Input label="Caliber" value={formState.caliber} onChangeText={text => handleInputChange('caliber', text)} />
                    <View>
            <Text style={styles.label}>Type</Text>
            <Select<string> items={nfaTypeOptions} onValueChange={value => handleInputChange('type', value)} selectedValue={formState.type} placeholder="Select NFA Type" headerTitle="Select NFA Type" />
          </View>
          <Input label="Tax Stamp ID" value={formState.tax_stamp_id_number} onChangeText={text => handleInputChange('tax_stamp_id_number', text)} />
                    <View>
            <Text style={styles.label}>Tax Stamp Type</Text>
            <Select<string> items={taxStampTypeOptions} onValueChange={value => handleInputChange('tax_stamp_type', value)} selectedValue={formState.tax_stamp_type} placeholder="Select Tax Stamp Type" headerTitle="Select Tax Stamp Type" />
          </View>
          <TouchableOpacity onPress={() => showDatepicker('tax_stamp_submission_date')}><Input label="Submission Date" value={formatDate(formState.tax_stamp_submission_date)} editable={false} /></TouchableOpacity>
          <TouchableOpacity onPress={() => showDatepicker('tax_stamp_approval_date')}><Input label="Approval Date" value={formatDate(formState.tax_stamp_approval_date)} editable={false} /></TouchableOpacity>
          <Input label="Value" value={String(formState.value)} onChangeText={text => handleInputChange('value', Number(text))} keyboardType="numeric" />
          <Input label="Round Count" value={String(formState.round_count)} onChangeText={text => handleInputChange('round_count', Number(text))} keyboardType="numeric" />
          <Button title="Change Image" onPress={pickImageAsync} />
          {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />}
        </View>
      ) : (
        <View>
          {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />}
          {renderDetailRow('Type', nfaItem.type)}
          {renderDetailRow('Caliber', nfaItem.caliber)}
          {renderDetailRow('Tax Stamp ID', nfaItem.tax_stamp_id_number)}
          {renderDetailRow('Tax Stamp Type', nfaItem.tax_stamp_type)}
          {renderDetailRow('Submission Date', formatDate(nfaItem.tax_stamp_submission_date))}
          {renderDetailRow('Approval Date', formatDate(nfaItem.tax_stamp_approval_date))}
          {renderDetailRow('Value', `$${nfaItem.value}`)}
          {renderDetailRow('Round Count', nfaItem.round_count)}
        </View>
      )}

      {storeError && <Text style={{ color: colors.error, textAlign: 'center', marginVertical: 10 }}>{storeError}</Text>}

      {isEditing && (
        <View style={styles.buttonContainer}>
          <Button title="Cancel" onPress={() => setIsEditing(false)} variant="outline" />
          <Button title={isLoading ? 'Saving...' : 'Save'} onPress={handleSave} disabled={isLoading} />
        </View>
      )}

      <Button title="Close" onPress={closeDrawer} variant="ghost" style={{ marginTop: 12 }} />

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

  
