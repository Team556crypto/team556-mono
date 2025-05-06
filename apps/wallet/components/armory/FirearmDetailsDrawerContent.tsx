import React from 'react'
import { View, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import { Text, useTheme } from '@team556/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Firearm } from '@/services/api'
import { LinearGradient } from 'expo-linear-gradient'

interface FirearmDetailsDrawerContentProps {
  firearm: Firearm
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const FirearmDetailsDrawerContent = ({ firearm }: FirearmDetailsDrawerContentProps) => {
  const { colors } = useTheme()

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
                <Text style={styles.title}>{firearm.name}</Text>
                <Text style={styles.subtitle}>{firearm.caliber}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  console.log('Edit firearm:', firearm.id)
                  // Handle edit action here
                }}
              >
                <MaterialCommunityIcons name='pencil' size={18} color={colors.primary} />
                <Text style={{ color: colors.primary }}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{firearm.type || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Manufacturer</Text>
          <Text style={styles.detailValue}>{firearm.manufacturer || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model</Text>
          <Text style={styles.detailValue}>{firearm.model_name || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Caliber</Text>
          <Text style={styles.detailValue}>{firearm.caliber || 'N/A'}</Text>
        </View>
        <View style={[styles.detailRow, styles.detailRowLast]}>
          <Text style={styles.detailLabel}>Serial Number</Text>
          <Text style={styles.detailValue}>{firearm.serial_number || 'N/A'}</Text>
        </View>
      </View>

      {(firearm.purchase_price || firearm.value_raw || firearm.acquisition_date_raw) && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Acquisition Details</Text>
          {firearm.acquisition_date_raw && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Acquired</Text>
              <Text style={styles.detailValue}>{new Date(firearm.acquisition_date_raw).toLocaleDateString()}</Text>
            </View>
          )}
          {firearm.purchase_price && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price</Text>
              <Text style={styles.detailValue}>${firearm.purchase_price}</Text>
            </View>
          )}
          {firearm.value_raw && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Current Value</Text>
              <Text style={styles.detailValue}>${firearm.value_raw?.toString() || '0'}</Text>
            </View>
          )}
        </View>
      )}

      {(firearm.last_fired || firearm.round_count_raw || firearm.last_cleaned) && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Maintenance Info</Text>
          {firearm.round_count_raw && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Round Count</Text>
              <Text style={styles.detailValue}>{firearm.round_count_raw?.toString() || '0'}</Text>
            </View>
          )}
          {firearm.last_fired && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Fired</Text>
              <Text style={styles.detailValue}>{new Date(firearm.last_fired).toLocaleDateString()}</Text>
            </View>
          )}
          {firearm.last_cleaned && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Last Cleaned</Text>
              <Text style={styles.detailValue}>{new Date(firearm.last_cleaned).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      )}

      {/* {firearm.status_raw && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{firearm.status_raw.toUpperCase()}</Text>
        </View>
      )} */}
    </ScrollView>
  )
}
