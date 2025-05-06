import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Text, useTheme } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Firearm, UpdateFirearmPayload } from '@/services/api'
import { LinearGradient } from 'expo-linear-gradient'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'

interface FirearmDetailsDrawerContentProps {
  firearm: Firearm
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const FirearmDetailsDrawerContent = ({ firearm }: FirearmDetailsDrawerContentProps) => {
  const { colors } = useTheme()
  const { updateFirearm: updateFirearmAction, isLoading: isStoreLoading, error: storeError } = useFirearmStore();
  const { token } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false)
  const [editableFirearm, setEditableFirearm] = useState<Partial<Firearm>>(firearm)

  useEffect(() => {
    setEditableFirearm(firearm)
  }, [firearm, isEditing])

  if (!firearm) {
    return null
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 60
    },
    headerContainer: {
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20
    },
    headerGradient: {
      width: '100%',
      padding: 0
    },
    imageContainer: {
      width: '100%',
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundDarker,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden'
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
    },
    placeholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundDark
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textTertiary,
      fontWeight: '500',
      marginTop: 8
    },
    categoryTag: {
      position: 'absolute',
      top: 16,
      left: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.backgroundDarker,
      borderWidth: 1,
      borderColor: colors.primary
    },
    categoryText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600'
    },
    infoContainer: {
      padding: 20,
      backgroundColor: colors.background,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16
    },
    titleContainer: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500'
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12
    },
    detailsSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    detailRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0
    },
    detailLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '500'
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
      maxWidth: '60%',
      textAlign: 'right'
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginVertical: 16
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.primary,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 8
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700'
    },
    editButton: {
      borderRadius: 18,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 5,
      paddingHorizontal: 10
    },
    titleTextContainer: {
      flex: 1
    },
    inputStyle: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
      maxWidth: '60%',
      textAlign: 'right',
      paddingVertical: 4,
      paddingHorizontal: 6,
      backgroundColor: colors.backgroundSubtle,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primarySubtleDark
    }
  })

  const renderImage = () => {
    if (firearm.image_raw) {
      return (
        <>
          <Image source={{ uri: firearm.image_raw }} style={styles.image} />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'Firearm'}</Text>
          </View>
        </>
      )
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={getFirearmIcon()} size={48} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'Firearm'}</Text>
          </View>
        </>
      )
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <View style={styles.imageContainer}>{renderImage()}</View>
        <LinearGradient colors={[colors.backgroundCard, colors.backgroundDark]} style={styles.headerGradient}>
          <View style={styles.infoContainer}>
            <View style={styles.titleContainer}>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>{isEditing ? editableFirearm.name : firearm.name}</Text>
                <Text style={styles.subtitle}>{isEditing ? editableFirearm.caliber : firearm.caliber}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={async () => {
                  if (isEditing) {
                    if (!firearm || typeof firearm.id === 'undefined') {
                      Alert.alert("Error", "Firearm ID is missing. Cannot save.");
                      return;
                    }
                    // Prepare payload: only send changed fields and ensure types are correct
                    const payload: UpdateFirearmPayload = {};
                    (Object.keys(editableFirearm) as Array<keyof Firearm>).forEach(key => {
                      let originalValue = firearm[key];
                      let currentValue = editableFirearm[key];
                      let isChanged = false;

                      // Type-specific comparison and coercion for payload
                      switch (key) {
                        case 'name':
                        case 'type':
                        case 'serial_number':
                        case 'manufacturer':
                        case 'model_name':
                        case 'caliber':
                        case 'acquisition_date_raw': // Keep as string or null
                        case 'last_fired': // Keep as string or null
                        case 'last_cleaned': // Keep as string or null
                        case 'image_raw': // string | null
                        case 'status_raw': // string | null
                          const currentStr = currentValue === null || currentValue === undefined ? null : String(currentValue).trim();
                          const originalStr = originalValue === null || originalValue === undefined ? null : String(originalValue).trim();
                          if (currentStr !== originalStr) {
                            (payload as any)[key] = currentStr === "" ? null : currentStr; // Ensure empty strings become null if appropriate for API
                            isChanged = true;
                          }
                          break;
                        case 'purchase_price': // String representation of decimal, can be null
                          const currentPriceStr = currentValue === null || currentValue === undefined ? null : String(currentValue).trim();
                          const originalPriceStr = originalValue === null || originalValue === undefined ? null : String(originalValue).trim();
                          if (currentPriceStr !== originalPriceStr) {
                            (payload as any)[key] = currentPriceStr === "" ? null : currentPriceStr;
                            isChanged = true;
                          }
                          break;
                        case 'round_count_raw':
                        case 'value_raw': // number | null
                          const currentNum = currentValue === null || currentValue === '' || currentValue === undefined ? null : Number(currentValue);
                          const originalNum = originalValue === null || originalValue === '' || originalValue === undefined ? null : Number(originalValue);
                          if (currentNum !== originalNum) {
                            (payload as any)[key] = currentNum;
                            isChanged = true;
                          }
                          break;
                        // default: // for any other keys, though we've covered Firearm fields
                        //   if (currentValue !== originalValue) {
                        //     (payload as any)[key] = currentValue;
                        //     isChanged = true;
                        //   }
                        //   break;
                      }
                    });

                    if (Object.keys(payload).length === 0) {
                      setIsEditing(false); // No changes, just exit edit mode
                      return;
                    }

                    try {
                      await updateFirearmAction(firearm.id, payload, token);
                      setIsEditing(false); // Exit edit mode on success
                      Alert.alert("Success", "Firearm details updated.");
                    } catch (err: any) {
                      console.error('Failed to update firearm:', err);
                      Alert.alert("Error", err.message || "Could not update firearm details.");
                      // Optionally, keep isEditing true so user can retry or see errors
                    }
                  } else {
                    setEditableFirearm(firearm); // Ensure editable is fresh when starting edit
                    setIsEditing(true)
                  }
                }}
              >
                <MaterialCommunityIcons name={isEditing ? "content-save" : "pencil"} size={18} color={colors.primary} />
                <Text style={{ color: colors.primary }}>{isEditing ? (isStoreLoading ? 'Saving...' : 'Save') : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputStyle}
              value={editableFirearm.type || ''}
              onChangeText={text => setEditableFirearm({ ...editableFirearm, type: text })}
              placeholder='Type'
              placeholderTextColor={colors.textTertiary}
            />
          ) : (
            <Text style={styles.detailValue}>{firearm.type || 'N/A'}</Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Manufacturer</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputStyle}
              value={editableFirearm.manufacturer || ''}
              onChangeText={text => setEditableFirearm({ ...editableFirearm, manufacturer: text })}
              placeholder='Manufacturer'
              placeholderTextColor={colors.textTertiary}
            />
          ) : (
            <Text style={styles.detailValue}>{firearm.manufacturer || 'N/A'}</Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputStyle}
              value={editableFirearm.model_name || ''}
              onChangeText={text => setEditableFirearm({ ...editableFirearm, model_name: text })}
              placeholder='Model'
              placeholderTextColor={colors.textTertiary}
            />
          ) : (
            <Text style={styles.detailValue}>{firearm.model_name || 'N/A'}</Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Caliber</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputStyle}
              value={editableFirearm.caliber || ''}
              onChangeText={text => setEditableFirearm({ ...editableFirearm, caliber: text })}
              placeholder='Caliber'
              placeholderTextColor={colors.textTertiary}
            />
          ) : (
            <Text style={styles.detailValue}>{firearm.caliber || 'N/A'}</Text>
          )}
        </View>
        <View style={[styles.detailRow, styles.detailRowLast]}>
          <Text style={styles.detailLabel}>Serial Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputStyle}
              value={editableFirearm.serial_number || ''}
              onChangeText={text => setEditableFirearm({ ...editableFirearm, serial_number: text })}
              placeholder='Serial Number'
              placeholderTextColor={colors.textTertiary}
            />
          ) : (
            <Text style={styles.detailValue}>{firearm.serial_number || 'N/A'}</Text>
          )}
        </View>
      </View>

      {(firearm.purchase_price || firearm.value_raw || firearm.acquisition_date_raw || isEditing) && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Acquisition Details</Text>
          {(firearm.acquisition_date_raw || isEditing) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Acquired</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.acquisition_date_raw || ''}
                  onChangeText={text => setEditableFirearm({ ...editableFirearm, acquisition_date_raw: text })}
                  placeholder='YYYY-MM-DD'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>
                  {firearm.acquisition_date_raw ? new Date(firearm.acquisition_date_raw).toLocaleDateString() : 'N/A'}
                </Text>
              )}
            </View>
          )}
          {(firearm.purchase_price || isEditing) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.purchase_price?.toString() || ''}
                  onChangeText={text => setEditableFirearm({ ...editableFirearm, purchase_price: text })}
                  placeholder='0.00'
                  keyboardType='decimal-pad'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>${firearm.purchase_price || 'N/A'}</Text>
              )}
            </View>
          )}
          {(firearm.value_raw || isEditing) && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Current Value</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.value_raw?.toString() || ''}
                  onChangeText={text => setEditableFirearm({ ...editableFirearm, value_raw: Number(text) || null })}
                  placeholder='0.00'
                  keyboardType='numeric'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>${firearm.value_raw?.toString() || 'N/A'}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {(firearm.last_fired || firearm.round_count_raw || firearm.last_cleaned || isEditing) && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Maintenance Info</Text>
          {(firearm.round_count_raw || isEditing) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Round Count</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.round_count_raw?.toString() || ''}
                  onChangeText={text =>
                    setEditableFirearm({ ...editableFirearm, round_count_raw: parseInt(text, 10) || null })
                  }
                  placeholder='0'
                  keyboardType='number-pad'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>{firearm.round_count_raw?.toString() || 'N/A'}</Text>
              )}
            </View>
          )}
          {(firearm.last_fired || isEditing) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Fired</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.last_fired || ''}
                  onChangeText={text => setEditableFirearm({ ...editableFirearm, last_fired: text })}
                  placeholder='YYYY-MM-DD'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>
                  {firearm.last_fired ? new Date(firearm.last_fired).toLocaleDateString() : 'N/A'}
                </Text>
              )}
            </View>
          )}
          {(firearm.last_cleaned || isEditing) && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Last Cleaned</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputStyle}
                  value={editableFirearm.last_cleaned || ''}
                  onChangeText={text => setEditableFirearm({ ...editableFirearm, last_cleaned: text })}
                  placeholder='YYYY-MM-DD'
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.detailValue}>
                  {firearm.last_cleaned ? new Date(firearm.last_cleaned).toLocaleDateString() : 'N/A'}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}
