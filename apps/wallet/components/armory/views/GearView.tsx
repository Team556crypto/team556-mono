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
import { Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Gear } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useGearStore } from '@/store/gearStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
// import { GearDetailsDrawerContent } from '@/components/drawers/armory/details/GearDetailsDrawerContent';
// import { AddGearDrawerContent } from '@/components/drawers/armory/add/AddGearDrawerContent';
import GearCard from '../cards/GearCard';
import { viewStyles } from './styles';

// Responsive layout constants
const COLUMN_GAP = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const GearView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('gear'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()
  const styles = viewStyles(colors, COLUMN_GAP)

  const getResponsiveLayout = () => {
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) return 5;
    if (screenWidth >= LARGE_SCREEN_BREAKPOINT) return 4;
    if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) return 3;
    return 2; // Default for small screens
  };

  const numColumns = getResponsiveLayout();

  const gears = useGearStore(state => state.gear)
  const isLoading = useGearStore(state => state.isLoading)
  const gearStoreError = useGearStore(state => state.error)
  const fetchInitialGears = useGearStore(state => state.fetchInitialGear)
  const deleteGear = useGearStore(state => state.deleteGear)
  const hasAttemptedInitialFetch = useGearStore(state => state.hasAttemptedInitialFetch)
  const clearGearError = useGearStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialGears(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialGears])

  const handleGearPress = (gear: Gear) => {
    // openDrawer(<GearDetailsDrawerContent gear={gear} />, { maxHeight: '90%' });
  }

  const handleAddGear = () => {
    // openDrawer(<AddGearDrawerContent />);
  }

  const handleDelete = (gearId: number) => {
    Alert.alert(
      'Delete Gear',
      'Are you sure you want to delete this gear? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteGear(gearId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete gear.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    )
  }

  const renderItem = ({ item }: { item: Gear }) => (
    <View style={{ flex: 1, margin: COLUMN_GAP / 2 }}>
      <GearCard
        gear={item}
        onPress={() => handleGearPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </View>
  );

  let content = null

  if (isLoading && gears.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (gearStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{gearStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearGearError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (gears.length === 0) {
    content = (
      // <EmptyState
      //   icon={<MaterialCommunityIcons name='tent' size={80} color={colors.primary} />}
      //   title='No Ammunition Yet'
      //   subtitle='Get started by adding your first ammunition to your armory.'
      //   buttonText='+ Add Ammunition'
      //   onPress={handleAddGear}
      // /> 
      <EmptyState
        icon={<MaterialCommunityIcons name='tent' size={80} color={colors.primary} />}
        title='Coming Soon!'
        subtitle='Gear is currently in development and will be available soon.'
        buttonText='+ Add Gear'
        onPress={handleAddGear}
      />
    )
  } else {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='tent' size={80} color={colors.primary} />}
        title='Coming Soon!'
        subtitle='Gear is currently in development and will be available soon.'
        buttonText='+ Add Gear'
        onPress={handleAddGear}
      />
      // <FlatList
      //   key={numColumns}
      //   data={gears}
      //   renderItem={renderItem}
      //   keyExtractor={item => item.id.toString()}
      //   numColumns={numColumns}
      //   style={styles.flatListContainer}
      //   contentContainerStyle={styles.gridContent}
      //   columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      //   ListHeaderComponent={
      //     isLoading && gears.length > 0 ? (
      //       <ActivityIndicator style={{ marginVertical: 20 }} size='large' color={colors.primary} />
      //     ) : null
      //   }
      // />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset='h3' accessibilityRole='header'>
            My Gear
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${gears.length})`}</Text>
          {!isP1User && !canAddItem && gears.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddGear} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add Gear</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}