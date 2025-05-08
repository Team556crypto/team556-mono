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
  const { updateFirearm: updateFirearmAction, isLoading: isStoreLoading, error: storeError } = useFirearmStore()
  const { token } = useAuthStore()

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

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
    } catch (e) {
      return dateString // Return original if parsing fails
    }
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
      backgroundColor: colors.backgroundDarker, // Changed for better contrast if image fails
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
      backgroundColor: colors.backgroundDark // Keep dark for placeholder consistency
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
    if (firearm.image) {
      return (
        <>
          <Image source={{ uri: firearm.image }} style={styles.image} />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'N/A'}</Text>
          </View>
        </>
      )
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={getFirearmIcon()} size={64} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'N/A'}</Text>
          </View>
        </>
      )
    }
  }

  const renderDetailRow = (
    label: string,
    value?: string | number | null,
    isLast = false,
    customValueStyle?: object
  ) => {
    const displayValue = value === undefined || value === null || value === '' ? 'N/A' : String(value)
    return (
      <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, customValueStyle]}>{displayValue}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Header with Image */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={[colors.backgroundDark, colors.background]} style={styles.headerGradient}>
          <View style={styles.imageContainer}>
            {firearm.image ? (
              <Image source={{ uri: firearm.image }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name={getFirearmIcon()} size={64} color={colors.textTertiary} />
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{firearm.type || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.titleContainer}>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>
                  {firearm.name || 'N/A'}
                </Text>
                <Text style={styles.subtitle}>
                  {firearm.manufacturer || 'Unknown Manufacturer'} - {firearm.model_name || 'Unknown Model'}
                </Text>
              </View>
              {/* Edit button can be re-enabled later */}
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
                <MaterialCommunityIcons name='pencil-outline' size={24} color={colors.primary} />
                <Text preset='label'>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* General Details Section */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        {renderDetailRow('Type', firearm.type)}
        {renderDetailRow('Manufacturer', firearm.manufacturer)}
        {renderDetailRow('Model', firearm.model_name)}
        {renderDetailRow('Caliber', firearm.caliber)}
        {renderDetailRow('Serial Number', firearm.serial_number)}
        {renderDetailRow('Status', firearm.status, true)}
      </View>

      {/* Acquisition Details Section */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Acquisition Details</Text>
        {renderDetailRow('Acquisition Date', formatDateForDisplay(firearm.acquisition_date))}
        {renderDetailRow('Purchase Price', firearm.purchase_price ? `$${firearm.purchase_price}` : 'N/A')}
        {renderDetailRow('Current Value', firearm.value ? `$${firearm.value}` : 'N/A', true)}
      </View>

      {/* Maintenance Info Section */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Maintenance Info</Text>
        {renderDetailRow('Last Fired', formatDateForDisplay(firearm.last_fired))}
        {renderDetailRow('Last Cleaned', formatDateForDisplay(firearm.last_cleaned))}
        {renderDetailRow('Round Count', firearm.round_count, true)}
      </View>

      {/* Ballistic Performance (Optional Section) */}
      {firearm.ballistic_performance && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Ballistic Performance</Text>
          {renderDetailRow('Notes', firearm.ballistic_performance, true)}
        </View>
      )}

      {/* Spacer for bottom button if any in the future */}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
