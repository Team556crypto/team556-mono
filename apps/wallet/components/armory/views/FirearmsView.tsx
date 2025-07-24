import React, { useEffect } from 'react'
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import FirearmCard from '../cards/FirearmCard';

import { FirearmDetailsDrawerContent } from '@/components/drawers/armory/details/FirearmDetailsDrawerContent'
import { AddFirearmDrawerContent } from '@/components/drawers/armory/add/AddFirearmDrawerContent'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { viewStyles } from './styles';

// Responsive layout constants
const COLUMN_GAP = 12
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const FirearmsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('firearm'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()
  const styles = viewStyles(colors, COLUMN_GAP)

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
