import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, Button, Input, useTheme, Select } from '@team556/ui'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import type { Firearm, UpdateFirearmPayload } from '@team556/ui'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import * as FileSystem from 'expo-file-system'

const SCREEN_HEIGHT = Dimensions.get('window').height
const windowWidth = Dimensions.get('window').width

const FIREARM_TYPES = [
  { label: 'Pistol', value: 'Pistol' },
  { label: 'Revolver', value: 'Revolver' },
  { label: 'Rifle', value: 'Rifle' },
  { label: 'Shotgun', value: 'Shotgun' },
  { label: 'Derringer', value: 'Derringer' },
  { label: 'Other', value: 'Other' }
]

interface FirearmDetailsDrawerContentProps {
  firearm: Firearm
}

type EditableFirearm = Firearm & {
  newImagePreviewUri?: string // For local preview of the new image
  newImageFile?: ImagePicker.ImagePickerAsset // Full asset for upload
}

type FirearmDateFieldKey = 'acquisition_date' | 'last_fired' | 'last_cleaned'

export const FirearmDetailsDrawerContent: React.FC<FirearmDetailsDrawerContentProps> = ({ firearm }) => {
  const { colors } = useTheme()
  const { updateFirearm: updateFirearmAction, isLoading: isStoreLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editableFirearm, setEditableFirearm] = useState<EditableFirearm>(() => ({
    ...firearm,
    newImagePreviewUri: undefined,
    newImageFile: undefined
  }))

  // State for DateTimePicker Modal
  const [showDatePicker, setShowDatePicker] = useState(false) // This now controls the Modal visibility
  const [datePickerField, setDatePickerField] = useState<FirearmDateFieldKey | null>(null)
  const [currentDateValue, setCurrentDateValue] = useState(new Date()) // Used by DateTimePicker inside modal
  const [modalSelectedDate, setModalSelectedDate] = useState(new Date()) // Temp date in modal before confirm

  useEffect(() => {
    setEditableFirearm({ ...firearm })
  }, [firearm])

  useEffect(() => {
    if (isEditing) {
      setEditableFirearm({ ...firearm })
    }
  }, [isEditing])

  if (!firearm) {
    return null
  }

  const handleInputChange = (field: keyof UpdateFirearmPayload, value: any) => {
    setEditableFirearm(prev => ({ ...prev, [field]: value }))
  }

  // Called by DateTimePicker's onChange inside the modal
  const onDateChangeInModal = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const date = selectedDate || modalSelectedDate // Fallback to current modal date if undefined
    if (Platform.OS === 'android') {
      // For Android, 'set' means a date was picked
      if (event.type === 'set') {
        setModalSelectedDate(date)
      }
      // For Android, closing the picker (dismissed) also needs to hide our modal if we don't have explicit cancel/confirm
      // However, since we have explicit confirm/cancel, we only update modalSelectedDate here.
      // setShowDatePicker(false); // Only if no confirm/cancel buttons
    } else {
      // For iOS, selectedDate is always provided.
      setModalSelectedDate(date)
    }
  }

  // Called when 'Confirm' is pressed in the modal
  const handleConfirmDate = () => {
    if (datePickerField) {
      handleInputChange(datePickerField, modalSelectedDate.toISOString())
    }
    setShowDatePicker(false)
    setDatePickerField(null)
  }

  // Called when 'Cancel' is pressed in the modal or modal overlay is tapped
  const handleCancelDate = () => {
    setShowDatePicker(false)
    setDatePickerField(null)
  }

  const showDatepickerForField = (fieldKey: FirearmDateFieldKey) => {
    const fieldValue = editableFirearm[fieldKey]
    let initialPickerDate = new Date()

    if (typeof fieldValue === 'string') {
      const parsedDate = new Date(fieldValue)
      if (!isNaN(parsedDate.getTime())) {
        initialPickerDate = parsedDate
      }
    }

    setDatePickerField(fieldKey)
    setCurrentDateValue(initialPickerDate) // Set the initial display date for the picker itself
    setModalSelectedDate(initialPickerDate) // Set the temp date that can be confirmed
    setShowDatePicker(true) // Show the modal
  }

  const handleSave = async () => {
    if (!token || !editableFirearm || typeof firearm.id !== 'number') {
      Alert.alert('Error', 'Cannot save firearm. Authentication token or original firearm ID is missing.')
      return
    }

    setIsEditing(true)

    // Create a shallow copy to avoid direct mutation if editableFirearm is part of a larger state or prop
    const tempEditableFirearm = { ...editableFirearm }

    // Remove newImagePreviewUri and newImageFile from the direct payload sent to backend
    // These are client-side helpers for UI and image data preparation
    delete tempEditableFirearm.newImagePreviewUri
    delete tempEditableFirearm.newImageFile

    const { id, owner_user_id, created_at, updated_at, ...payloadFromState } = tempEditableFirearm as Omit<
      EditableFirearm,
      'newImagePreviewUri' | 'newImageFile'
    >

    const updatePayload: UpdateFirearmPayload = {
      id: firearm.id,
      ...(payloadFromState as Partial<Omit<Firearm, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>>)
    }

    // If a new image file was selected, prepare its data for upload
    if (editableFirearm.newImageFile) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(editableFirearm.newImageFile.uri)
        if (!fileInfo.exists) {
          Alert.alert('Error', 'Selected image file does not exist.')
          setIsEditing(false)
          return
        }

        const base64ImageData = await FileSystem.readAsStringAsync(editableFirearm.newImageFile.uri, {
          encoding: FileSystem.EncodingType.Base64
        })

        // Just send the base64 data - the backend will handle adding the data:image prefix if needed
        updatePayload.imageData = base64ImageData

        // These fields are still useful for metadata, though not required for base64 storage
        updatePayload.imageName = editableFirearm.newImageFile.fileName || `firearm_${firearm.id}_new_image`
        updatePayload.imageType = editableFirearm.newImageFile.mimeType || 'image/png'
        updatePayload.imageSize = editableFirearm.newImageFile.fileSize

        // Since new image data is being sent, ensure the old 'image' URL field is not part of payload unless intended
        // If backend clears image if imageData is present, this is fine.
        // Or explicitly set updatePayload.image = undefined; if your backend uses that to mean 'no change to existing URL unless imageData is also present'
      } catch (error) {
        console.error('Error reading image file for upload:', error)
        Alert.alert('Error', 'Could not prepare image for upload.')
        setIsEditing(false)
        return
      }
    } else if (editableFirearm.newImagePreviewUri === null && firearm.image && !editableFirearm.newImageFile) {
      // This condition means user explicitly cleared the image (e.g., via a "Remove Image" button)
      // and there was an original image, and no new file was selected to replace it.
      updatePayload.image = '' // Send empty string to signal removal to backend
      // Also clear out any potential lingering new image fields if any were partially set then cleared
      delete updatePayload.imageData
      delete updatePayload.imageName
      delete updatePayload.imageType
      delete updatePayload.imageSize
    }

    // Ensure other fields that might be undefined are handled correctly
    // (e.g. if a field was null and is now undefined in payloadFromState, ensure it's passed as null or omitted as per backend expectation)
    // This is generally handled by Partial and how ...spread works with undefined properties.

    try {
      await updateFirearmAction(firearm.id, updatePayload, token)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Failed to update firearm:', error)
      Alert.alert('Error', storeError || error.message || 'Could not update firearm.')
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditableFirearm({ ...firearm })
    setIsEditing(false)
  }

  const getFirearmIcon = () => {
    const type = firearm.type?.toLowerCase() || ''
    if (type.includes('pistol') || type.includes('handgun')) {
      return 'target'
    } else if (type.includes('rifle') || type.includes('shotgun')) {
      return 'crosshairs'
    } else if (type.includes('nfa')) {
      return 'shield'
    }
    return 'crosshairs-gps'
  }

  const formatDateForDisplay = (dateString?: string | null | Date) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return String(dateString)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
    } catch (e) {
      return String(dateString)
    }
  }

  const handleChooseImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access camera roll is required!')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Consider if you want users to crop/resize
      aspect: [16, 10], // If allowsEditing is true, this can guide the crop aspect ratio
      quality: 0.4 // Compress image to 70% quality
    })

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedAsset = pickerResult.assets[0]
      setEditableFirearm(prev => ({
        ...prev,
        newImagePreviewUri: selectedAsset.uri, // Use local URI for preview
        newImageFile: selectedAsset // Store the full asset
      }))
    }
  }

  const clearNewImage = () => {
    setEditableFirearm(prev => ({
      ...prev,
      newImagePreviewUri: undefined,
      newImageFile: undefined
    }))
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      paddingBottom: 16
    },
    imageContainer: {
      width: windowWidth * 0.9, // 90% of screen width
      aspectRatio: 16 / 10, // Maintain a 4:3 aspect ratio
      alignSelf: 'center', // Center the container
      backgroundColor: colors.backgroundDark,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      justifyContent: 'center', // For placeholder centering
      alignItems: 'center', // For placeholder centering
      overflow: 'hidden' // Ensures image respects border radius
    },
    editImageButton: {
      // Style for the edit image button/overlay
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 8,
      borderRadius: 20,
      zIndex: 2, // Higher z-index to ensure it's above other elements
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 5 // For Android
    },
    removeImageButton: {
      // Style for removing a newly selected image
      position: 'absolute',
      top: 12,
      right: 56, // Position to the left of the edit button
      backgroundColor: 'rgba(200,0,0,0.7)',
      padding: 8,
      borderRadius: 20,
      zIndex: 2, // Higher z-index to ensure it's above other elements
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 5 // For Android
    },
    image: {
      width: '100%',
      height: '100%'
      // resizeMode: 'contain' // contentFit on component takes precedence for expo-image
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    placeholderText: {
      color: colors.textSecondary,
      marginTop: 8
    },
    categoryTag: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark semi-transparent background for better contrast
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 3,
      elevation: 5 // For Android
    },
    categoryText: {
      color: '#FFFFFF', // White text for maximum readability
      fontWeight: 'bold',
      fontSize: 12
    },
    infoSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.background,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primarySubtle
    },
    sectionTitle: {
      marginBottom: 16,
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold'
    },
    detailRow: {
      // flexDirection: 'row',
      // justifyContent: 'flex-start', // Changed from 'space-between'
      // alignItems: 'center',
      // paddingVertical: 10,
      gap: 8,
      // borderBottomWidth: 1,
      // borderBottomColor: colors.primarySubtle,
      marginBottom: 10
    },
    detailRowLast: {
      borderBottomWidth: 0
    },
    detailLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      flex: 2,
      marginRight: 8 // Added margin for spacing
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
      flex: 3,
      textAlign: 'right'
    },
    inputField: {
      flex: 3,
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      borderRadius: 8, // Matched AddFirearmDrawerContent inputStyle
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.backgroundSubtle,
      minHeight: 40, // Standard height
      fontWeight: '500' // Matched AddFirearmDrawerContent inputStyle
    },
    multilineInputField: {
      minHeight: 80, // Allow more space for multiline
      textAlignVertical: 'top', // Start text from the top
      paddingTop: 8 // Ensure padding is consistent with single line
    },
    selectContainerStyle: {
      flex: 3,
      marginBottom: 12
    },
    dateTouchable: {
      flex: 3, // Occupy available space like other inputs
      flexDirection: 'row', // Align icon and text horizontally
      alignItems: 'center', // Center items vertically
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      borderRadius: 8, // Matched AddFirearmDrawerContent inputStyle/dateContainer
      paddingHorizontal: 12,
      backgroundColor: colors.backgroundSubtle,
      minHeight: 40, // Standard height
      height: 40, // Explicit height to match AddFirearmDrawerContent dateContainer,
      marginBottom: 12
    },
    dateText: {
      fontSize: 15,
      color: colors.text, // Default text color
      marginLeft: 8, // Space between icon and text
      flex: 1 // Allow text to take remaining space
    },
    placeholderDateText: {
      fontSize: 15,
      color: colors.textTertiary, // Placeholder color from AddFirearmDrawerContent
      marginLeft: 8,
      flex: 1
    },
    datePickerIcon: {
      // marginRight: 8, // Added margin to the text instead
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 8
    },
    buttonStyle: {
      flex: 1
    },
    loadingIndicator: {
      marginTop: 20
    },
    // Copied from AddFirearmDrawerContent.tsx and adapted for colors from useTheme()
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    },
    datePickerContainer: {
      backgroundColor: colors.backgroundCard, // Use theme color
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.primary, // Use theme color
      width: '90%', //SCREEN_WIDTH * 0.9 - using percentage for simplicity here
      maxWidth: 380,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary, // Use theme color
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
    }
  })

  const renderDetailRow = (
    label: string,
    value?: string | number | null,
    isLast = false,
    customValueStyle?: object
  ) => {
    const displayValue = value === undefined || value === null || String(value).trim() === '' ? 'N/A' : String(value)
    return (
      <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, customValueStyle]} numberOfLines={1} ellipsizeMode='tail'>
          {displayValue}
        </Text>
      </View>
    )
  }

  const getInitialDate = (dateString?: string | Date | null) => {
    if (!dateString) return undefined
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? undefined : date
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* <LinearGradient colors={[colors.backgroundCard, colors.background]} style={styles.header}> */}
      <View style={styles.imageContainer}>
        {isEditing && editableFirearm.newImagePreviewUri && (
          <TouchableOpacity style={styles.removeImageButton} onPress={clearNewImage}>
            <MaterialCommunityIcons name='close' size={20} color='white' />
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity style={styles.editImageButton} onPress={handleChooseImage}>
            <MaterialCommunityIcons name='pencil' size={20} color='white' />
          </TouchableOpacity>
        )}
        {editableFirearm.newImagePreviewUri ||
        (editableFirearm && typeof editableFirearm.image === 'string' && editableFirearm.image.trim() !== '') ? (
          <Image
            source={{ uri: editableFirearm.newImagePreviewUri || editableFirearm.image }}
            style={styles.image}
            contentFit='cover'
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={getFirearmIcon()} size={64} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>{editableFirearm ? 'No Image' : 'Loading...'}</Text>
          </View>
        )}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{isEditing ? editableFirearm.type || 'N/A' : firearm.type || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          {isEditing ? (
            <View style={[styles.detailRow, { paddingVertical: 0, borderBottomWidth: 0, marginBottom: 0, flex: 1 }]}>
              <Text style={styles.detailLabel}>Name</Text>
              <Input
                value={editableFirearm.name || ''}
                onChangeText={text => handleInputChange('name', text)}
                placeholder='Enter firearm name'
                style={[styles.inputField, { flex: 3 }]} // Ensure inputField takes up appropriate space
              />
            </View>
          ) : (
            <Text
              style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, flex: 1 }}
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {firearm.name}
            </Text>
          )}
          {!isEditing && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: colors.primarySubtle,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.primary
              }}
              onPress={() => setIsEditing(!isEditing)}
            >
              <MaterialCommunityIcons
                name={isEditing ? 'close-circle-outline' : 'pencil-outline'}
                size={20}
                color={colors.primary}
              />
              <Text preset='label' style={{ marginLeft: 4, color: colors.primary }}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {!isEditing && (
          <Text style={{ fontSize: 16, color: colors.textSecondary }} numberOfLines={1} ellipsizeMode='tail'>
            {firearm.manufacturer ? `${firearm.manufacturer} ` : ''}
            {firearm.model_name || ''}
          </Text>
        )}
      </View>
      {/* </LinearGradient> */}

      <View style={styles.infoSection}>
        <Text preset='h4' style={styles.sectionTitle}>
          Details
        </Text>
        {isEditing ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <View style={styles.selectContainerStyle}>
                <Select
                  items={FIREARM_TYPES}
                  selectedValue={editableFirearm.type}
                  onValueChange={value => handleInputChange('type', value as string)}
                  placeholder='Select firearm type'
                  style={{
                    selectButton: {
                      ...styles.inputField, // Base styling from inputField
                      paddingVertical: 0, // Adjust for Select component if necessary
                      justifyContent: 'center', // Center text vertically
                      height: 40 // Explicit height,
                    },
                    selectButtonText: {
                      fontSize: 15,
                      color: editableFirearm.type ? colors.text : colors.textTertiary,
                      fontWeight: '500'
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
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.manufacturer || ''}
                onChangeText={text => handleInputChange('manufacturer', text)}
                placeholder='Enter manufacturer'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.model_name || ''}
                onChangeText={text => handleInputChange('model_name', text)}
                placeholder='Enter model'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial #</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.serial_number || ''}
                onChangeText={text => handleInputChange('serial_number', text)}
                placeholder='Enter serial number'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Caliber</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.caliber || ''}
                onChangeText={text => handleInputChange('caliber', text)}
                placeholder='Enter caliber'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.status || ''}
                onChangeText={text => handleInputChange('status', text)}
                placeholder='Enter status'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Input
                style={[styles.inputField, styles.multilineInputField]}
                value={editableFirearm.ballistic_performance || ''}
                onChangeText={text => handleInputChange('ballistic_performance', text)}
                placeholder='Enter notes or ballistic performance data'
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textTertiary}
                textAlignVertical='top'
              />
            </View>
          </>
        ) : (
          <>
            {renderDetailRow('Type', firearm.type)}
            {renderDetailRow('Manufacturer', firearm.manufacturer)}
            {renderDetailRow('Model', firearm.model_name)}
            {renderDetailRow('Serial Number', firearm.serial_number)}
            {renderDetailRow('Caliber', firearm.caliber)}
            {renderDetailRow('Status', firearm.status)}
            {renderDetailRow('Notes', firearm.ballistic_performance, true)}
          </>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text preset='h4' style={styles.sectionTitle}>
          Acquisition Details
        </Text>
        {isEditing ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Acquisition Date</Text>
              <TouchableOpacity onPress={() => showDatepickerForField('acquisition_date')} style={styles.dateTouchable}>
                <MaterialCommunityIcons
                  name='calendar-blank-outline'
                  size={20}
                  color={colors.textSecondary}
                  style={styles.datePickerIcon}
                />
                <Text style={editableFirearm.acquisition_date ? styles.dateText : styles.placeholderDateText}>
                  {editableFirearm.acquisition_date
                    ? formatDateForDisplay(editableFirearm.acquisition_date)
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price</Text>
              <Input
                style={styles.inputField}
                value={String(editableFirearm.purchase_price || '')}
                onChangeText={text => handleInputChange('purchase_price', text)}
                placeholder='Enter price'
                keyboardType='numeric'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Value</Text>
              <Input
                style={styles.inputField}
                value={String(editableFirearm.value || '')}
                onChangeText={text => handleInputChange('value', text)}
                placeholder='Enter current value'
                keyboardType='numeric'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </>
        ) : (
          <>
            {renderDetailRow('Acquisition Date', formatDateForDisplay(firearm.acquisition_date))}
            {renderDetailRow(
              'Purchase Price',
              firearm.purchase_price ? `$${Number(firearm.purchase_price).toLocaleString()}` : 'N/A'
            )}
            {renderDetailRow(
              'Current Value',
              firearm.value ? `$${Number(firearm.value).toLocaleString()}` : 'N/A',
              true
            )}
          </>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text preset='h4' style={styles.sectionTitle}>
          Usage Details
        </Text>
        {isEditing ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Fired</Text>
              <TouchableOpacity onPress={() => showDatepickerForField('last_fired')} style={styles.dateTouchable}>
                <MaterialCommunityIcons
                  name='calendar-blank-outline'
                  size={20}
                  color={colors.textSecondary}
                  style={styles.datePickerIcon}
                />
                <Text style={editableFirearm.last_fired ? styles.dateText : styles.placeholderDateText}>
                  {editableFirearm.last_fired ? formatDateForDisplay(editableFirearm.last_fired) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Round Count</Text>
              <Input
                style={styles.inputField}
                value={editableFirearm.round_count ? String(editableFirearm.round_count) : ''}
                onChangeText={text => handleInputChange('round_count', text)}
                placeholder='Enter round count'
                keyboardType='numeric'
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Cleaned</Text>
              <TouchableOpacity onPress={() => showDatepickerForField('last_cleaned')} style={styles.dateTouchable}>
                <MaterialCommunityIcons
                  name='calendar-blank-outline'
                  size={20}
                  color={colors.textSecondary}
                  style={styles.datePickerIcon}
                />
                <Text style={editableFirearm.last_cleaned ? styles.dateText : styles.placeholderDateText}>
                  {editableFirearm.last_cleaned ? formatDateForDisplay(editableFirearm.last_cleaned) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {renderDetailRow('Last Fired', formatDateForDisplay(firearm.last_fired))}
            {renderDetailRow('Round Count', firearm.round_count)}
            {renderDetailRow('Last Cleaned', formatDateForDisplay(firearm.last_cleaned), true)}
          </>
        )}
      </View>

      {showDatePicker && (
        <Modal
          transparent={true}
          animationType='fade'
          visible={showDatePicker}
          onRequestClose={handleCancelDate} // Android back button
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPressOut={handleCancelDate} // Allow dismissing by tapping outside
          >
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={styles.datePickerContainer}>
              {/* Content of the modal, stopPropagation to prevent closing when tapping inside */}
              <View>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    testID='dateTimePicker'
                    value={currentDateValue} // This should be the date that the picker initially shows
                    mode='date'
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChangeInModal} // Updates modalSelectedDate
                    themeVariant='dark' // from AddFirearmDrawerContent
                    textColor={colors.text} // from AddFirearmDrawerContent
                    // accentColor={colors.primary} // from AddFirearmDrawerContent - Note: accentColor is Android only for specific displays
                  />
                </View>
                <View style={styles.datePickerActions}>
                  <Button title='Cancel' onPress={handleCancelDate} variant='ghost' style={{ marginRight: 8 }} />
                  <Button title='Confirm' onPress={handleConfirmDate} variant='primary' />
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {isEditing && (
        <View style={styles.actionsContainer}>
          <Button
            title='Cancel'
            onPress={handleCancel}
            variant='outline'
            style={styles.buttonStyle}
            disabled={isStoreLoading}
          />
          <Button
            title='Save Changes'
            onPress={handleSave}
            variant='primary'
            style={styles.buttonStyle}
            loading={isStoreLoading}
            disabled={isStoreLoading}
          />
        </View>
      )}
    </ScrollView>
  )
}
