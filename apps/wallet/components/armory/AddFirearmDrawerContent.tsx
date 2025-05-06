import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Platform, Modal } from 'react-native'
import { Text, useTheme, Button } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Firearm } from '@/services/api'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'

// Define a local payload type for creating firearms, as it's not in api.ts
// This should ideally come from @/services/api if a create endpoint exists
export interface CreateFirearmPayload {
  name: string
  type: string
  serial_number: string
  manufacturer?: string
  model_name?: string
  caliber?: string
  acquisition_date_raw?: Date | string
  purchase_price?: string
  ballistic_performance?: string
  image_raw?: string
  round_count_raw?: number
  value_raw?: number
  status_raw?: string
  last_fired?: Date | string
  last_cleaned?: Date | string
}

// Initial state for a new firearm
const initialFirearmState: CreateFirearmPayload = {
  name: '',
  type: '',
  serial_number: '',
  manufacturer: '',
  model_name: '',
  caliber: '',
  acquisition_date_raw: undefined,
  purchase_price: '',
  ballistic_performance: '',
  image_raw: '',
  round_count_raw: 0,
  value_raw: 0.0,
  status_raw: '',
  last_fired: undefined,
  last_cleaned: undefined
}

export const AddFirearmDrawerContent = () => {
  const { colors } = useTheme()
  const { addFirearm, isLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const [newFirearm, setNewFirearm] = useState<CreateFirearmPayload>(initialFirearmState)

  // State for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerField, setDatePickerField] = useState<keyof CreateFirearmPayload | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date())

  const handleInputChange = (field: keyof CreateFirearmPayload, value: any) => {
    setNewFirearm((prev: CreateFirearmPayload) => ({ ...prev, [field]: value }))
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

  const showMode = (fieldKey: keyof CreateFirearmPayload) => {
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

  const handleSaveFirearm = async () => {
    if (!newFirearm.name || !newFirearm.type || !newFirearm.serial_number) {
      Alert.alert('Error', 'Name, Type, and Serial Number are required.')
      return
    }

    const roundCount = newFirearm.round_count_raw ? parseInt(String(newFirearm.round_count_raw), 10) : 0
    const value = newFirearm.value_raw ? parseFloat(String(newFirearm.value_raw)) : 0.0

    if (isNaN(roundCount) || isNaN(value)) {
      Alert.alert('Error', 'Round Count and Value must be valid numbers.')
      return
    }

    const firearmToAdd: Firearm = {
      id: Date.now(),
      owner_user_id: 0,
      name: newFirearm.name!,
      type: newFirearm.type!,
      serial_number: newFirearm.serial_number!,
      manufacturer: newFirearm.manufacturer || null,
      model_name: newFirearm.model_name || null,
      caliber: newFirearm.caliber || '',
      acquisition_date_raw:
        newFirearm.acquisition_date_raw instanceof Date
          ? newFirearm.acquisition_date_raw.toISOString()
          : newFirearm.acquisition_date_raw || null,
      purchase_price: newFirearm.purchase_price || null,
      ballistic_performance: newFirearm.ballistic_performance || null,
      image_raw: newFirearm.image_raw || null,
      round_count_raw: roundCount,
      value_raw: value,
      status_raw: newFirearm.status_raw || null,
      last_fired:
        newFirearm.last_fired instanceof Date ? newFirearm.last_fired.toISOString() : newFirearm.last_fired || null,
      last_cleaned:
        newFirearm.last_cleaned instanceof Date
          ? newFirearm.last_cleaned.toISOString()
          : newFirearm.last_cleaned || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      addFirearm(firearmToAdd)
      Alert.alert('Success', 'Firearm added locally! (Backend integration needed)')
      setNewFirearm(initialFirearmState)
      closeDrawer()
    } catch (e: any) {
      Alert.alert('Error', e.message || storeError || 'Failed to add firearm locally.')
    }
  }

  const renderDetailRow = (
    label: string,
    field: keyof CreateFirearmPayload,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    isDate = false
  ) => {
    if (isDate) {
      const displayValue = newFirearm[field]
        ? newFirearm[field] instanceof Date
          ? (newFirearm[field] as Date).toLocaleDateString()
          : new Date(newFirearm[field] as string).toLocaleDateString()
        : placeholder
      return (
        <TouchableOpacity
          onPress={() => {
            console.log('AddFirearmDrawerContent: Date row pressed for field:', field)
            showMode(field)
          }}
          style={styles.detailRow}
        >
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={[styles.inputStyle, !newFirearm[field] && styles.placeholderText]}>{displayValue}</Text>
        </TouchableOpacity>
      )
    } else {
      return (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          <TextInput
            style={styles.inputStyle}
            value={newFirearm[field] ? String(newFirearm[field]) : ''}
            onChangeText={text => handleInputChange(field, text)}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            keyboardType={keyboardType}
          />
        </View>
      )
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      marginBottom: 60
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center'
    },
    section: {
      marginBottom: 20
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textSecondary,
      marginBottom: 12
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundDarker
    },
    detailLabel: {
      fontSize: 15,
      color: colors.textSecondary
    },
    inputStyle: {
      fontSize: 15,
      color: colors.text,
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
      paddingVertical: 4
    },
    placeholderText: {
      color: colors.textTertiary
    },
    buttonContainer: {
      marginTop: 32
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)' // Semi-transparent background
    },
    datePickerContainer: {
      backgroundColor: Platform.OS === 'ios' ? colors.text : colors.background, // White background for iOS picker container
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      elevation: 5
    }
  })

  return (
    <React.Fragment>
      <ScrollView style={styles.container} keyboardShouldPersistTaps='handled'>
        <Text style={styles.title}>Add New Firearm</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Details</Text>
          {renderDetailRow('Name', 'name', 'Enter firearm name')}
          {renderDetailRow('Type', 'type', 'e.g., Pistol, Rifle')}
          {renderDetailRow('Serial Number', 'serial_number', 'Enter serial number')}
          {renderDetailRow('Manufacturer', 'manufacturer', 'Enter manufacturer')}
          {renderDetailRow('Model', 'model_name', 'Enter model name')}
          {renderDetailRow('Caliber', 'caliber', 'e.g., 9mm, 5.56 NATO')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acquisition & Value</Text>
          {renderDetailRow('Acquisition Date', 'acquisition_date_raw', 'Select date', 'default', true)}
          {renderDetailRow('Purchase Price', 'purchase_price', 'e.g., 500.00', 'numeric')}
          {renderDetailRow('Current Value', 'value_raw', 'e.g., 450.00', 'numeric')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage & Maintenance</Text>
          {renderDetailRow('Round Count', 'round_count_raw', 'e.g., 1500', 'numeric')}
          {renderDetailRow('Last Fired Date', 'last_fired', 'Select date', 'default', true)}
          {renderDetailRow('Last Cleaned Date', 'last_cleaned', 'Select date', 'default', true)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {renderDetailRow('Status', 'status_raw', 'e.g., In Service, In Storage')}
          {renderDetailRow('Ballistic Performance', 'ballistic_performance', 'e.g., Sub-MOA at 100yds')}
          {renderDetailRow('Image URL', 'image_raw', 'Optional: http://image.url')}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? 'Adding...' : 'Add Firearm'}
            onPress={handleSaveFirearm}
            disabled={isLoading}
            variant='primary'
          />
          <Button title='Cancel' onPress={closeDrawer} variant='ghost' style={{ marginTop: 12 }} />
        </View>
        {storeError && (
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 10 }}>Error: {storeError}</Text>
        )}
      </ScrollView>
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType='slide'
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false)
            setDatePickerField(null)
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                testID='dateTimePicker'
                value={currentDateValue}
                mode={'date'}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                themeVariant='light' // Added for better visibility
              />
              {/* Add a button to confirm selection for iOS, as events might differ */}
              {Platform.OS === 'ios' && (
                <Button
                  title='Done'
                  onPress={() => onDateChange({ type: 'set' } as DateTimePickerEvent, currentDateValue)}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </React.Fragment>
  )
}
