import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import FirearmCard from './FirearmCard';

import { FirearmDetailsDrawerContent } from '@/components/drawers/FirearmDetailsDrawerContent'
import { AddFirearmDrawerContent } from '@/components/drawers/AddFirearmDrawerContent'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const COLUMN_GAP = 12
const PADDING = 12
const SMALL_SCREEN_BREAKPOINT = 480
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const FirearmsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('firearm'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()

  const getResponsiveLayout = () => {
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) return 5
    if (screenWidth >= LARGE_SCREEN_BREAKPOINT) return 4
    if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) return 3
    return 2 // Default for small screens
  }

  const numColumns = getResponsiveLayout()

  const firearms = useFirearmStore(state => state.firearms)
  const isLoading = useFirearmStore(state => state.isLoading)
  const firearmStoreError = useFirearmStore(state => state.error)
  const fetchInitialFirearms = useFirearmStore(state => state.fetchInitialFirearms)
  const deleteFirearm = useFirearmStore(state => state.deleteFirearm)
  const hasAttemptedInitialFetch = useFirearmStore(state => state.hasAttemptedInitialFetch)
  const clearFirearmError = useFirearmStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialFirearms(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialFirearms])

  const handleFirearmPress = (firearm: Firearm) => {
    openDrawer(<FirearmDetailsDrawerContent firearm={firearm} />, { maxHeight: '90%' });
  }

  const handleAddFirearm = () => {
    openDrawer(<AddFirearmDrawerContent />);
  }

  const handleDelete = (firearmId: number) => {
    Alert.alert(
      'Delete Firearm',
      'Are you sure you want to delete this firearm? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteFirearm(firearmId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete firearm.');
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
      height: '100%',
      backgroundColor: colors.backgroundDarker
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      zIndex: 1,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    flatListContainer: {
      height: '100%',
    },
    gridContent: {
      paddingBottom: 40
    },
    columnWrapper: {
      gap: COLUMN_GAP,
      justifyContent: 'flex-start'
    },
    gridItem: {
      marginBottom: COLUMN_GAP,
      alignItems: 'center'
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

  const renderItem = ({ item }: { item: Firearm }) => (
    <View style={{ flex: 1, margin: COLUMN_GAP / 2 }}>
      <FirearmCard
        firearm={item}
        onPress={() => handleFirearmPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </View>
  )

  let content = null

  if (isLoading && firearms.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (firearmStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{firearmStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearFirearmError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (firearms.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='pistol' size={80} color={colors.primary} />}
        title='No Firearms Yet'
        subtitle='Get started by adding your first firearm to your armory.'
        buttonText='+ Add Firearm'
        onPress={handleAddFirearm}
      />
    )
  } else {
    content = (
      <FlatList
        key={numColumns}
        data={firearms}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && firearms.length > 0 ? (
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
            My Firearms
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${firearms.length})`}</Text>
          {!isP1User && !canAddItem && firearms.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddFirearm} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add Firearm</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}
