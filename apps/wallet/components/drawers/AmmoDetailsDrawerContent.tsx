import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, Button, Input, useTheme } from '@team556/ui'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import type { Ammo, UpdateAmmoPayload } from '@team556/ui'
import { useAmmoStore } from '@/store/ammoStore'
import { useAuthStore } from '@/store/authStore'
import * as FileSystem from 'expo-file-system'

const windowWidth = Dimensions.get('window').width

interface AmmoDetailsDrawerContentProps {
  ammo: Ammo
}

type EditableAmmo = Ammo & {
  newImagePreviewUri?: string
  newImageFile?: ImagePicker.ImagePickerAsset
}

export const AmmoDetailsDrawerContent: React.FC<AmmoDetailsDrawerContentProps> = ({ ammo }) => {
  const { colors } = useTheme()
  const { updateAmmo: updateAmmoAction, isLoading: isStoreLoading, error: storeError } = useAmmoStore()
  const { token } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editableAmmo, setEditableAmmo] = useState<EditableAmmo>(() => ({
    ...ammo,
    newImagePreviewUri: undefined,
    newImageFile: undefined
  }))

  useEffect(() => {
    setEditableAmmo({ ...ammo })
  }, [ammo])

  useEffect(() => {
    if (isEditing) {
      setEditableAmmo({ ...ammo })
    }
  }, [isEditing])

  if (!ammo) {
    return null
  }

  const handleInputChange = (field: keyof UpdateAmmoPayload, value: any) => {
    setEditableAmmo((prev: EditableAmmo) => {
      let processedValue = value
      const numericFields: (keyof UpdateAmmoPayload)[] = ['grainWeight', 'quantity', 'purchasePrice']
      if (numericFields.includes(field)) {
        const numValue = parseFloat(value)
        processedValue = isNaN(numValue) ? null : numValue
      }
      const updatedAmmo = { ...prev, [field]: processedValue }
      return updatedAmmo
    })
  }

  const handleSave = async () => {
    if (!token || !editableAmmo || typeof ammo.id !== 'number') {
      Alert.alert('Error', 'Cannot save ammo. Authentication token or original ammo ID is missing.')
      return
    }

    setIsEditing(true)

    const tempEditableAmmo = { ...editableAmmo }
    delete tempEditableAmmo.newImagePreviewUri
    delete tempEditableAmmo.newImageFile

    const { id, owner_user_id, created_at, updated_at, ...payloadFromState } = tempEditableAmmo as Omit<
      EditableAmmo,
      'newImagePreviewUri' | 'newImageFile'
    >

    const updatePayload: UpdateAmmoPayload = {
      id: ammo.id,
      ...(payloadFromState as Partial<Omit<Ammo, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>>)
    }

    if (editableAmmo.newImageFile) {
      if (Platform.OS === 'web' && editableAmmo.newImageFile.base64) {
        updatePayload.imageData = editableAmmo.newImageFile.base64
        updatePayload.imageName = editableAmmo.newImageFile.fileName || `ammo_${ammo.id}_new_image`
        updatePayload.imageType = editableAmmo.newImageFile.mimeType || 'image/jpeg'
        updatePayload.imageSize = editableAmmo.newImageFile.fileSize
      } else if (Platform.OS !== 'web') {
        try {
          const base64ImageData = await FileSystem.readAsStringAsync(editableAmmo.newImageFile.uri, {
            encoding: FileSystem.EncodingType.Base64
          })
          updatePayload.imageData = base64ImageData
          updatePayload.imageName = editableAmmo.newImageFile.fileName || `ammo_${ammo.id}_new_image`
          updatePayload.imageType = editableAmmo.newImageFile.mimeType || 'image/jpeg'
          updatePayload.imageSize = editableAmmo.newImageFile.fileSize
        } catch (error: any) {
          console.error('Error reading image file for upload:', error)
          Alert.alert('Error', error.message || 'Could not prepare image for upload.')
          setIsEditing(false)
          return
        }
      } else {
        Alert.alert('Warning', 'Could not get image data for web. Please try a smaller image.')
        setIsEditing(false)
        return
      }
    } else if (editableAmmo.newImagePreviewUri === null && ammo.pictures && !editableAmmo.newImageFile) {
      updatePayload.pictures = ''
    }

    try {
      await updateAmmoAction(ammo.id, updatePayload, token)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Failed to update ammo:', error)
      Alert.alert('Error', storeError || error.message || 'Could not update ammo.')
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditableAmmo({ ...ammo })
    setIsEditing(false)
  }

  const handleChooseImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access camera roll is required!')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.4,
      base64: Platform.OS === 'web'
    })

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedAsset = pickerResult.assets[0]
      setEditableAmmo(prev => ({
        ...prev,
        newImagePreviewUri: selectedAsset.uri,
        newImageFile: selectedAsset
      }))
    }
  }

  const clearNewImage = () => {
    setEditableAmmo(prev => ({
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
      width: windowWidth * 0.9,
      maxWidth: 500,
      aspectRatio: 16 / 10,
      alignSelf: 'center',
      backgroundColor: colors.backgroundDark,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primarySubtle,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    },
    editImageButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 8,
      borderRadius: 20,
      zIndex: 2
    },
    removeImageButton: {
      position: 'absolute',
      top: 12,
      right: 56,
      backgroundColor: 'rgba(200,0,0,0.7)',
      padding: 8,
      borderRadius: 20,
      zIndex: 2
    },
    image: {
      width: '100%',
      height: '100%'
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    contentContainer: {
      paddingHorizontal: 20
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8
    },
    detailRow: {
      gap: 8,
      marginBottom: 10
    },
    detailText: {
      fontSize: 16
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
      paddingBottom: 20
    }
  })

  const currentImageUri = editableAmmo.newImagePreviewUri ?? ammo.pictures

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {isEditing && (
            <TouchableOpacity style={styles.editImageButton} onPress={handleChooseImage}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          {isEditing && editableAmmo.newImagePreviewUri && (
            <TouchableOpacity style={styles.removeImageButton} onPress={clearNewImage}>
              <MaterialCommunityIcons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          {currentImageUri ? (
            <Image source={{ uri: currentImageUri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="camera-off" size={48} color={colors.text} />
              <Text>No Image</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{`${editableAmmo.manufacturer} ${editableAmmo.caliber}`}</Text>

        {isEditing ? (
          <View>
            <View style={styles.detailRow}>
              <Input
                label="Manufacturer"
                value={editableAmmo.manufacturer || ''}
                onChangeText={text => handleInputChange('manufacturer', text)}
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Caliber"
                value={editableAmmo.caliber || ''}
                onChangeText={text => handleInputChange('caliber', text)}
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Type"
                value={editableAmmo.type || ''}
                onChangeText={text => handleInputChange('type', text)}
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Grain Weight"
                value={String(editableAmmo.grainWeight || '')}
                onChangeText={text => handleInputChange('grainWeight', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Quantity"
                value={String(editableAmmo.quantity || '')}
                onChangeText={text => handleInputChange('quantity', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Purchase Price"
                value={String(editableAmmo.purchasePrice || '')}
                onChangeText={text => handleInputChange('purchasePrice', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.detailRow}>
              <Input
                label="Notes"
                value={editableAmmo.notes || ''}
                onChangeText={text => handleInputChange('notes', text)}
                multiline
              />
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.detailText}>Type: {ammo.type}</Text>
            <Text style={styles.detailText}>Grain Weight: {`${ammo.grainWeight}gr`}</Text>
            <Text style={styles.detailText}>Quantity: {String(ammo.quantity)}</Text>
            <Text style={styles.detailText}>Purchase Price: ${ammo.purchasePrice ? ammo.purchasePrice.toFixed(2) : 'N/A'}</Text>
            <Text style={styles.detailText}>Notes: {ammo.notes || 'N/A'}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {isEditing ? (
            <>
              <Button title="Save" onPress={handleSave} loading={isStoreLoading} />
              <Button title="Cancel" onPress={handleCancel} variant="secondary" />
            </>
          ) : (
            <Button title="Edit" onPress={() => setIsEditing(true)} />
          )}
        </View>
      </View>
    </ScrollView>
  )
}
