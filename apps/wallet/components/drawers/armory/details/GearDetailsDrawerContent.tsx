import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, Button, useTheme } from '@team556/ui'
import type { Gear } from '@team556/ui'
import { useGearStore } from '@/store/gearStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'
import { getCategoryLabel, getSubcategoryLabel } from '@/constants/gear'

interface GearDetailsDrawerContentProps {
  gear: Gear
}

export const GearDetailsDrawerContent: React.FC<GearDetailsDrawerContentProps> = ({ gear }) => {
  const { colors } = useTheme()
  const { deleteGear } = useGearStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const handleDelete = () => {
    Alert.alert(
      'Delete Gear',
      `Are you sure you want to delete ${gear.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGear(gear.id, token)
              closeDrawer()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete gear.')
            }
          }
        }
      ]
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.primarySubtle
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12
    },
    titleContainer: {
      flex: 1,
      marginRight: 12
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12
    },
    categoryText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 4
    },
    imageContainer: {
      width: '100%',
      height: 240,
      backgroundColor: colors.backgroundDarker,
      borderRadius: 12,
      overflow: 'hidden',
      marginVertical: 16,
      justifyContent: 'center',
      alignItems: 'center'
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
    },
    placeholderIcon: {
      opacity: 0.3
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.primarySubtle
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundLight
    },
    detailRowLast: {
      borderBottomWidth: 0
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right'
    },
    notesSection: {
      paddingHorizontal: 20,
      paddingVertical: 16
    },
    notesText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12
    }
  })

  const renderDetailRow = (label: string, value: string | number | undefined, isLast = false) => {
    if (!value && value !== 0) return null
    return (
      <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    )
  }

  const renderSpecifications = () => {
    if (!gear.specifications) return null
    
    const specs = typeof gear.specifications === 'string' 
      ? JSON.parse(gear.specifications) 
      : gear.specifications

    const specEntries = Object.entries(specs).filter(([_, value]) => value)
    if (specEntries.length === 0) return null

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cog" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Specifications</Text>
        </View>
        {specEntries.map(([key, value], index) => (
          <View key={key} style={[styles.detailRow, index === specEntries.length - 1 && styles.detailRowLast]}>
            <Text style={styles.detailLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
            <Text style={styles.detailValue}>{String(value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  const getImageUri = () => {
    if (!gear.pictures) return null
    try {
      const pictures = JSON.parse(gear.pictures)
      return Array.isArray(pictures) && pictures.length > 0 ? pictures[0] : null
    } catch {
      return null
    }
  }

  const imageUri = getImageUri()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{gear.name}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
            <Text style={styles.categoryText}>{getCategoryLabel(gear.category)}</Text>
          </View>
        </View>
        {gear.subcategory && (
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>
            {getSubcategoryLabel(gear.category, gear.subcategory)}
          </Text>
        )}
      </View>

      {imageUri && (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        {renderDetailRow('Quantity', gear.quantity)}
        {renderDetailRow('Manufacturer', gear.manufacturer)}
        {renderDetailRow('Model', gear.model)}
        {renderDetailRow('Serial Number', gear.serialNumber)}
        {renderDetailRow('Status', gear.status, true)}
      </View>

      {renderSpecifications()}

      {(gear.purchaseDate || gear.purchasePrice || gear.storageLocation) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cart" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Purchase & Storage</Text>
          </View>
          {gear.purchaseDate && renderDetailRow('Purchase Date', new Date(gear.purchaseDate).toLocaleDateString())}
          {gear.purchasePrice && renderDetailRow('Purchase Price', `$${gear.purchasePrice.toFixed(2)}`)}
          {renderDetailRow('Storage Location', gear.storageLocation, true)}
        </View>
      )}

      {gear.notes && (
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="note-text" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{gear.notes}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button
          title="Delete"
          onPress={handleDelete}
          variant="outline"
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  )
};
