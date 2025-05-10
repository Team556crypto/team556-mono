import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  useWindowDimensions
} from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Button, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { FirearmDetailsDrawerContent } from '@/components/drawers/FirearmDetailsDrawerContent'
import { AddFirearmDrawerContent } from '@/components/drawers/AddFirearmDrawerContent'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const SMALL_SCREEN_BREAKPOINT = 480
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const FirearmsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
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

  const firearms = useFirearmStore(state => state.firearms)
  const isLoading = useFirearmStore(state => state.isLoading)
  const error = useFirearmStore(state => state.error)
  const fetchInitialFirearms = useFirearmStore(state => state.fetchInitialFirearms)
  const hasAttemptedInitialFetch = useFirearmStore(state => state.hasAttemptedInitialFetch)
  const { openDrawer } = useDrawerStore()

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialFirearms(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialFirearms])

  const handleFirearmPress = (firearm: Firearm) => {
    openDrawer(<FirearmDetailsDrawerContent firearm={firearm} />, { maxHeight: '90%' })
  }

  const handleAddFirearm = () => {
    openDrawer(<AddFirearmDrawerContent />)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    flatListContainer: {
      flex: 1,
      overflow: 'visible' // Allow content to flow naturally
    },
    gridContent: {
      paddingBottom: 40
    },
    columnWrapper: {
      gap: COLUMN_GAP,
      justifyContent: 'flex-start', // Change to flex-start for more natural alignment
      marginBottom: COLUMN_GAP * 1.5 // Increased vertical spacing
    },
    gridItem: {
      // Width will be applied dynamically in renderItem
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
      color: 'red',
      textAlign: 'center'
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
      color: '#805AD5', // Using a purple color that matches the UI
      fontWeight: '600'
    }
  })

  const renderItem = ({ item }: { item: Firearm }) => {
    return (
      <View style={[styles.gridItem, { width: dimensions.cardWidth }]}>
        <View style={styles.cardWrapper}>
          <FirearmCard
            firearm={item}
            onPress={() => handleFirearmPress(item)}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
          />
        </View>
      </View>
    )
  }

  // Use direct rendering instead of a function to avoid React reconciliation issues
  let content = null

  if (isLoading && firearms.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (!isLoading && firearms.length === 0) {
    content = (
      <View style={styles.emptyMessage}>
        <Text preset='label'>No firearms found</Text>
        <Button variant='secondary' title='Add firearm' onPress={handleAddFirearm} />
      </View>
    )
  } else if (error) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>Error loading firearms: {error}</Text>
      </View>
    )
  } else {
    // When using FlatList inside a screen that might already have a ScrollView,
    // we need to make sure the FlatList doesn't try to scroll the entire screen
    content = (
      <View style={styles.flatListContainer}>
        <FlatList
          data={firearms}
          renderItem={renderItem}
          keyExtractor={item => `firearm-${item.id}`}
          numColumns={dimensions.numColumns}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true} // Enable scrolling for larger datasets
          contentContainerStyle={styles.gridContent}
        />
      </View>
    )
  }

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.addButton, screenWidth >= MEDIUM_SCREEN_BREAKPOINT && styles.addButtonLarge]}
      onPress={handleAddFirearm}
    >
      <Ionicons name='add' size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 24 : 32} color={colors.primary} />
      {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && <Text style={styles.addButtonText}>Add Firearm</Text>}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text preset='h4'>Firearms</Text>
        {renderAddButton()}
      </View>
      {content}
    </View>
  )
}
