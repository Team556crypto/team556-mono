import React, { useEffect } from 'react'
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Ammo } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useAmmoStore } from '@/store/ammoStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { AmmoDetailsDrawerContent } from '@/components/drawers/armory/details/AmmoDetailsDrawerContent';
import { AddAmmoDrawerContent } from '@/components/drawers/armory/add/AddAmmoDrawerContent';
import AmmoCard from '../cards/AmmoCard';
import { viewStyles } from './styles';

// Responsive layout constants
const COLUMN_GAP = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const AmmoView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('ammo'))
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
    console.log('handleDelete called with ammoId:', ammoId);
    if (confirm('Are you sure you want to delete this ammunition? This action cannot be undone.')) {
      deleteAmmo(ammoId, token).catch(error => {
        console.error('Failed to delete ammo:', error);
        alert('Failed to delete ammo.');
      });
    }
  }

  const renderItem = ({ item }: { item: Ammo }) => (
    <View style={{ flex: 1, margin: COLUMN_GAP / 2 }}>
      <AmmoCard
        ammo={item}
        onPress={() => handleAmmoPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </View>
  );

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
        icon={<MaterialCommunityIcons name='ammunition' size={80} color={colors.primary} />}
        title='No Ammunition Yet'
        subtitle='Get started by adding your first ammunition to your armory.'
        buttonText='+ Add Ammunition'
        onPress={handleAddAmmo}
      />
    )
  } else {
    content = (
      <FlatList
        key={numColumns}
        data={ammos}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
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
