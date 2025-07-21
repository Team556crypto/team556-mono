import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT, AmmoCard } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Ammo } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useAmmoStore } from '@/store/ammoStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { AmmoDetailsDrawerContent } from '@/components/drawers/AmmoDetailsDrawerContent';
import { AddAmmoDrawerContent } from '@/components/drawers/AddAmmoDrawerContent';

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const AmmoView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('ammo'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()

  // Responsive sizing based on screen width
  const getResponsiveLayout = () => {
    let numColumns = 2 // Default for small screens

    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) {
      numColumns = 5
    } else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) {
      numColumns = 4
    } else if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) {
      numColumns = 3
    }

    // Calculate container width (accounting for the sidebar on large screens)
    const effectiveWidth = screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth

    // Calculate available width for grid (minus padding and gap)
    const availableWidth = effectiveWidth - PADDING * 2 - COLUMN_GAP * (numColumns - 1)

    // Card width is calculated based on available space
    const cardWidth = Math.max(DEFAULT_CARD_WIDTH, Math.floor(availableWidth / numColumns))

    // Calculate cardHeight proportionally
    const cardHeight = Math.floor(cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH))

    return { numColumns, cardWidth, cardHeight, effectiveWidth }
  }

  const { numColumns, cardWidth, cardHeight } = getResponsiveLayout()

  // Listen for screen dimension changes
  const [dimensions, setDimensions] = useState({ cardWidth, cardHeight, numColumns })

  useFocusEffect(
    useCallback(() => {
      const { cardWidth, cardHeight, numColumns } = getResponsiveLayout()
      setDimensions({ cardWidth, cardHeight, numColumns })
    }, [screenWidth])
  )

  const ammos = useAmmoStore(state => state.ammos)
  const isLoading = useAmmoStore(state => state.isLoading)
  const ammoStoreError = useAmmoStore(state => state.error)
  const fetchInitialAmmos = useAmmoStore(state => state.fetchInitialAmmos)
  const deleteAmmo = useAmmoStore(state => state.deleteAmmo)
  const hasAttemptedInitialFetch = useAmmoStore(state => state.hasAttemptedInitialFetch)
  const clearAmmoError = useAmmoStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialAmmos(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialAmmos])

  const handleAmmoPress = (ammo: Ammo) => {
    openDrawer(<AmmoDetailsDrawerContent ammo={ammo} />, { maxHeight: '90%' });
  }

  const handleAddAmmo = () => {
    openDrawer(<AddAmmoDrawerContent />);
  }

  const handleDelete = (ammoId: number) => {
    Alert.alert(
      'Delete Ammo',
      'Are you sure you want to delete this ammo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteAmmo(ammoId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete ammo.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      paddingHorizontal: PADDING
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    flatListContainer: {
      flex: 1,
      overflow: 'visible'
    },
    gridContent: {
      paddingBottom: 40
    },
    columnWrapper: {
      gap: COLUMN_GAP,
      justifyContent: 'flex-start',
      marginBottom: COLUMN_GAP * 1.5
    },
    gridItem: {
      margin: COLUMN_GAP / 2,
      alignItems: 'center',
    },
    cardWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    },
    centerMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginTop: 8
    },
    limitReachedText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: 8,
      paddingHorizontal: 16
    },
    emptyMessage: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.backgroundLight,
      backgroundColor: 'rgba(0,0,0,0.2)',
      gap: 12,
      paddingVertical: 48
    },
    addButton: {
      borderRadius: 8
    },
    addButtonHeaderSmall: {
      padding: 8,
      borderRadius: 8
    },
    addButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(128, 90, 213, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8
    },
    addButtonText: {
      color: '#805AD5',
      fontWeight: '600'
    }
  })

  const renderItem = ({ item }: { item: Ammo }) => {
    return (
      <View style={[styles.gridItem, { width: dimensions.cardWidth }]}>
        <View style={styles.cardWrapper}>
          <AmmoCard
            ammo={item}
            onPress={() => handleAmmoPress(item)}
            onDelete={() => handleDelete(item.id)}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
          />
        </View>
      </View>
    )
  }

  let content = null

  if (isLoading && ammos.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (ammoStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{ammoStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearAmmoError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (ammos.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='pistol' size={80} color={colors.primary} />}
        title='No Ammunition Yet'
        subtitle='Get started by adding your first ammunition to your armory.'
        buttonText='+ Add Ammunition'
        onPress={handleAddAmmo}
      />
    )
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={ammos}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && ammos.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 20 }} size='large' color={colors.primary} />
          ) : null
        }
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset='h3' accessibilityRole='header'>
            My Ammunition
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${ammos.length})`}</Text>
          {!isP1User && !canAddItem && ammos.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddAmmo} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add Ammunition</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}
