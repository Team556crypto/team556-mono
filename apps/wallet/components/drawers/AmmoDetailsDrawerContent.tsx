import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button, Input, useTheme } from '@team556/ui';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { Ammo, UpdateAmmoPayload } from '@team556/ui';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAmmoStore } from '@/store/ammoStore';
import { useAuthStore } from '@/store/authStore';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface AmmoDetailsDrawerContentProps {
  ammo: Ammo;
}

type EditableAmmo = Ammo & {
  newImagePreviewUris?: string[];
};

type AmmoDateFieldKey = 'purchaseDate';

export const AmmoDetailsDrawerContent: React.FC<AmmoDetailsDrawerContentProps> = ({ ammo }) => {
  const { colors } = useTheme();
  const { updateAmmo, isLoading: isStoreLoading, error: storeError } = useAmmoStore();
  const { token } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editableAmmo, setEditableAmmo] = useState<EditableAmmo>(() => ({
    ...ammo,
    newImagePreviewUris: [],
  }));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<AmmoDateFieldKey | null>(null);
  const [currentDateValue, setCurrentDateValue] = useState(new Date());

  const handleInputChange = (field: keyof UpdateAmmoPayload, value: any) => {
    setEditableAmmo(prev => ({ ...prev, [field]: value }));
  };

  const onDateChangeInModal = (event: DateTimePickerEvent, selectedDate?: Date | null) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (selectedDate && datePickerField) {
        handleInputChange(datePickerField, selectedDate.toISOString().split('T')[0]);
    }
  };

  const showDatepickerForField = (fieldKey: AmmoDateFieldKey) => {
    const dateValue = editableAmmo[fieldKey];
    setCurrentDateValue(dateValue ? new Date(dateValue) : new Date());
    setDatePickerField(fieldKey);
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    const { id, newImagePreviewUris, ...rest } = editableAmmo;
    const payload: UpdateAmmoPayload = {
        ...rest,
        pictures: JSON.stringify(editableAmmo.pictures),
    };
    await updateAmmo(id, payload, token || '');
    if (!storeError) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditableAmmo({ ...ammo, newImagePreviewUris: [] });
    setIsEditing(false);
  };

  const formatDateForDisplay = (dateString?: string | number | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleChooseImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant permission to access photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
        const uris = result.assets.map(asset => asset.uri);
        setEditableAmmo(prev => ({
            ...prev,
            pictures: JSON.stringify([...(JSON.parse(prev.pictures || '[]')), ...uris])
        }));
    }
  };
  
  const renderDetailRow = (label: string, value?: string | number | null, isLast = false) => (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  const pictures = JSON.parse(editableAmmo.pictures || '[]');

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[colors.background, colors.backgroundCard]} style={styles.header}>
        <Image source={{ uri: pictures[0] }} style={styles.headerImage} contentFit="cover">
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.imageOverlay} />
        </Image>
        <View style={styles.headerContent}>
            <MaterialCommunityIcons name="ammunition" size={48} color={colors.primary} />
            <Text style={styles.headerTitle}>{`${editableAmmo.manufacturer} ${editableAmmo.caliber}`}</Text>
            <Text style={styles.headerSubtitle}>{`${editableAmmo.grainWeight}gr ${editableAmmo.type}`}</Text>
        </View>
      </LinearGradient>

      <View style={styles.actionsContainer}>
        {!isEditing && <Button title="Edit Details" onPress={() => setIsEditing(true)} variant="primary" />}
      </View>

      {isEditing ? (
        <View style={styles.detailsContainer}>
            <Input label="Manufacturer" value={editableAmmo.manufacturer} onChangeText={text => handleInputChange('manufacturer', text)} />
            <Input label="Caliber" value={editableAmmo.caliber} onChangeText={text => handleInputChange('caliber', text)} />
            <Input label="Type" value={editableAmmo.type} onChangeText={text => handleInputChange('type', text)} />
            <Input label="Quantity" value={String(editableAmmo.quantity)} onChangeText={text => handleInputChange('quantity', Number(text))} keyboardType="numeric" />
            <Input label="Grain Weight" value={editableAmmo.grainWeight} onChangeText={text => handleInputChange('grainWeight', text)} />
            <TouchableOpacity onPress={() => showDatepickerForField('purchaseDate')} style={styles.dateTouchable}>
                <Text>{editableAmmo.purchaseDate ? formatDateForDisplay(editableAmmo.purchaseDate) : 'Select Purchase Date'}</Text>
            </TouchableOpacity>
            <Input label="Purchase Price" value={String(editableAmmo.purchasePrice)} onChangeText={text => handleInputChange('purchasePrice', text)} keyboardType="numeric" />
            <Input label="Notes" value={editableAmmo.notes || ''} onChangeText={text => handleInputChange('notes', text)} multiline />
            <Button title="Add Photos" onPress={handleChooseImage} />
        </View>
      ) : (
        <View style={styles.detailsContainer}>
            {renderDetailRow('Manufacturer', editableAmmo.manufacturer)}
            {renderDetailRow('Caliber', editableAmmo.caliber)}
            {renderDetailRow('Type', editableAmmo.type)}
            {renderDetailRow('Quantity', editableAmmo.quantity)}
            {renderDetailRow('Grain Weight', editableAmmo.grainWeight)}
            {renderDetailRow('Purchase Date', formatDateForDisplay(editableAmmo.purchaseDate))}
            {renderDetailRow('Purchase Price', `$${editableAmmo.purchasePrice}`)}
            {renderDetailRow('Notes', editableAmmo.notes, true)}
        </View>
      )}

      {showDatePicker && (
        <Modal transparent={true} visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
            <View style={styles.modalContainer}>
                <View style={styles.datePickerContainer}>
                    <DateTimePicker value={currentDateValue} mode="date" display="default" onChange={onDateChangeInModal} />
                </View>
            </View>
        </Modal>
      )}

      {isEditing && (
        <View style={styles.editActionsContainer}>
          <Button title="Cancel" onPress={handleCancel} variant="outline" style={styles.buttonStyle} disabled={isStoreLoading} />
          <Button title="Save Changes" onPress={handleSave} variant="primary" style={styles.buttonStyle} loading={isStoreLoading} disabled={isStoreLoading} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: SCREEN_HEIGHT * 0.3, justifyContent: 'center', alignItems: 'center' },
    headerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    imageOverlay: { flex: 1 },
    headerContent: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 8 },
    headerSubtitle: { fontSize: 16, color: 'white' },
    actionsContainer: { padding: 16 },
    detailsContainer: { padding: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#333' },
    detailLabel: { fontSize: 16, fontWeight: '500' },
    detailValue: { fontSize: 16 },
    dateTouchable: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginVertical: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    datePickerContainer: { backgroundColor: 'white', borderRadius: 10, padding: 20 },
    editActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
    buttonStyle: { flex: 1, marginHorizontal: 8 },
});

export default AmmoDetailsDrawerContent;
