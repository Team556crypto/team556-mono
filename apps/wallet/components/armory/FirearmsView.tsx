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

  const canAddFirearm = firearms.length < 2
  const betaMaxFirearmsMessage = 'Max 2 firearms (beta test limit)'

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialFirearms(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialFirearms])

  const handleFirearmPress = (firearm: Firearm) => {
    openDrawer(<FirearmDetailsDrawerContent firearm={firearm} />, { maxHeight: '90%' })
  }

  const handleAddFirearm = () => {
    if (!canAddFirearm) {
      Alert.alert('Limit Reached', betaMaxFirearmsMessage)
      return
    }
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
      marginBottom: 18
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
    gridItem: {},
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
    limitReachedText: {
      fontSize: 12,
      marginLeft: 8,
      color: colors.textSecondary
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
        <Button variant='secondary' title='Add firearm' onPress={handleAddFirearm} disabled={!canAddFirearm} />
        {!canAddFirearm && <Text style={styles.limitReachedText}>{betaMaxFirearmsMessage}</Text>}
      </View>
    )
  } else if (error) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>Error loading firearms: {error}</Text>
      </View>
    )
  } else {
    content = (
      <View style={styles.flatListContainer}>
        <FlatList
          data={firearms}
          renderItem={renderItem}
          keyExtractor={item => `firearm-${item.id}`}
          numColumns={dimensions.numColumns}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={styles.gridContent}
        />
      </View>
    )
  }

  const renderAddButton = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        style={[styles.addButton, screenWidth >= MEDIUM_SCREEN_BREAKPOINT && styles.addButtonLarge]}
        onPress={handleAddFirearm}
        disabled={!canAddFirearm}
      >
        <Ionicons
          name='add'
          size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 24 : 32}
          color={!canAddFirearm ? colors.backgroundDark : colors.primary}
        />
        {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
          <Text style={[styles.addButtonText, !canAddFirearm && { color: colors.backgroundDark }]}>Add Firearm</Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset='h4'>Firearms</Text>
          {!canAddFirearm && (
            <Text style={[styles.limitReachedText, { marginTop: 0, marginLeft: 0 }]}>({betaMaxFirearmsMessage})</Text>
          )}
        </View>
        {renderAddButton()}
      </View>
      {content}
    </View>
  )
}
