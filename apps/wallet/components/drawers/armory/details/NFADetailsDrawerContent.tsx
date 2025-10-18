import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, Button, useTheme } from '@team556/ui'
import type { NFA } from '@team556/ui'
import { useNFAStore } from '@/store/nfaStore'
import { useAuthStore } from '@/store/authStore'
import { useDrawerStore } from '@/store/drawerStore'

interface NFADetailsDrawerContentProps {
  nfa: NFA
}

export const NFADetailsDrawerContent: React.FC<NFADetailsDrawerContentProps> = ({ nfa }) => {
  const { colors } = useTheme()
  const { deleteNFAItem } = useNFAStore()
  const { token } = useAuthStore()
  const { closeDrawer } = useDrawerStore()

  const handleDelete = () => {
    Alert.alert(
      'Delete NFA Item',
      `Are you sure you want to delete ${nfa.manufacturer} ${nfa.model_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNFAItem(nfa.id, token)
              closeDrawer()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete NFA item.')
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
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12
    },
    typeText: {
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
    stampStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 8
    },
    stampStatusText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6
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

  const getNFATypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'suppressor': 'Suppressor',
      'sbr': 'Short Barrel Rifle',
      'sbs': 'Short Barrel Shotgun',
      'machine_gun': 'Machine Gun',
      'destructive_device': 'Destructive Device',
      'aow': 'Any Other Weapon'
    }
    return typeMap[type] || type
  }

  const getTaxStampTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'form_1': 'Form 1',
      'form_4': 'Form 4'
    }
    return typeMap[type] || type
  }

  const getStampStatus = () => {
    if (nfa.tax_stamp_approval_date) {
      return { label: 'Approved', color: colors.success, icon: 'check-circle' as const }
    }
    if (nfa.tax_stamp_submission_date) {
      return { label: 'Pending', color: colors.warning, icon: 'clock-outline' as const }
    }
    return { label: 'Not Submitted', color: colors.textSecondary, icon: 'alert-circle-outline' as const }
  }

  const stampStatus = getStampStatus()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{nfa.manufacturer} {nfa.model_name}</Text>
            <Text style={styles.subtitle}>{nfa.caliber}</Text>
          </View>
          <View style={styles.typeBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
            <Text style={styles.typeText}>{getNFATypeLabel(nfa.type)}</Text>
          </View>
        </View>
        <View style={[styles.stampStatusBadge, { backgroundColor: stampStatus.color + '20' }]}>
          <MaterialCommunityIcons name={stampStatus.icon} size={16} color={stampStatus.color} />
          <Text style={[styles.stampStatusText, { color: stampStatus.color }]}>
            Tax Stamp: {stampStatus.label}
          </Text>
        </View>
      </View>

      {nfa.picture && (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: nfa.picture }} style={styles.image} />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Firearm Details</Text>
        </View>
        {renderDetailRow('Manufacturer', nfa.manufacturer)}
        {renderDetailRow('Model', nfa.model_name)}
        {renderDetailRow('Caliber', nfa.caliber)}
        {renderDetailRow('Type', getNFATypeLabel(nfa.type))}
        {renderDetailRow('Round Count', nfa.round_count)}
        {renderDetailRow('Value', nfa.value ? `$${nfa.value.toFixed(2)}` : undefined, true)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="file-certificate" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Tax Stamp Information</Text>
        </View>
        {renderDetailRow('Form Type', getTaxStampTypeLabel(nfa.tax_stamp_type))}
        {renderDetailRow('Stamp ID Number', nfa.tax_stamp_id_number)}
        {nfa.tax_stamp_submission_date && renderDetailRow(
          'Submission Date',
          new Date(nfa.tax_stamp_submission_date).toLocaleDateString()
        )}
        {nfa.tax_stamp_approval_date && renderDetailRow(
          'Approval Date',
          new Date(nfa.tax_stamp_approval_date).toLocaleDateString(),
          true
        )}
      </View>

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
}
