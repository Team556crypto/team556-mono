import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  Alert
} from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Badge, Button, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { FirearmDetailsDrawerContent } from '@/components/drawers/FirearmDetailsDrawerContent'
import { AddFirearmDrawerContent } from '@/components/drawers/AddFirearmDrawerContent'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const CARD_GAP = 16
const LARGE_SCREEN_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1200

const betaMaxFirearmsMessage = 'You can add a maximum of 2 firearms during the beta.'

const AllItemsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const { width: screenWidth } = useWindowDimensions()

  const firearms = useFirearmStore(state => state.firearms)
  const isLoading = useFirearmStore(state => state.isLoading)
  const error = useFirearmStore(state => state.error)
  const fetchInitialFirearms = useFirearmStore(state => state.fetchInitialFirearms)
  const hasAttemptedInitialFetch = useFirearmStore(state => state.hasAttemptedInitialFetch)
  const { openDrawer } = useDrawerStore()

  const canAddFirearm = firearms.length < 2

  // Calculate responsive dimensions
  const getCardDimensions = () => {
    let cardWidth = DEFAULT_CARD_WIDTH
    let cardsPerRow = 2

    if (screenWidth >= DESKTOP_BREAKPOINT) {
      cardsPerRow = 5
    } else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) {
      cardsPerRow = 3
    }

    // For mobile horizontal scroll
    if (screenWidth < LARGE_SCREEN_BREAKPOINT) {
      cardWidth = screenWidth * 0.42
    } else {
      // For desktop grid layout
      const effectiveWidth = screenWidth >= LARGE_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth
      const availableWidth = effectiveWidth - 32 - CARD_GAP * (cardsPerRow - 1)
      cardWidth = availableWidth / cardsPerRow
    }

    const cardHeight = cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH)

    return {
      cardWidth,
      cardHeight,
      cardsPerRow
    }
  }

  const [dimensions, setDimensions] = useState(getCardDimensions())

  // Update dimensions when screen size changes
  useFocusEffect(
    useCallback(() => {
      setDimensions(getCardDimensions())
    }, [screenWidth])
  )

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialFirearms(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialFirearms])

  const handleFirearmPress = (firearm: Firearm) => {
    openDrawer(<FirearmDetailsDrawerContent firearm={firearm} />, { maxHeight: '90%' })
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    centerMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    errorText: {
      color: colors.error,
      textAlign: 'center'
    },
    limitReachedText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 16
    },
    emptyMessage: {
      flexGrow: 1,
      width: '100%',
      marginTop: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.backgroundLight,
      backgroundColor: colors.backgroundDark,
      gap: 12,
      paddingVertical: screenWidth >= LARGE_SCREEN_BREAKPOINT ? 48 : 24,
      minHeight: screenWidth >= LARGE_SCREEN_BREAKPOINT ? 300 : 200
    },
    scrollViewContent: {
      paddingVertical: 16,
      gap: 14
    },
    cardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: CARD_GAP,
      justifyContent: 'flex-start',
      paddingTop: 8,
      paddingBottom: 24
    },
    addFirearmCard: {
      width: dimensions.cardWidth,
      height: dimensions.cardHeight,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.backgroundLight,
      backgroundColor: colors.backgroundDark,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      ...(screenWidth >= LARGE_SCREEN_BREAKPOINT
        ? {}
        : {
            marginLeft: 8,
            marginRight: 16
          })
    },
    addFirearmText: {
      color: colors.primary,
      marginTop: 8
    }
  })

  // Helper function to render add button
  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addFirearmCard}
      onPress={() => {
        if (!canAddFirearm) {
          Alert.alert('Limit Reached', betaMaxFirearmsMessage)
          return
        }
        openDrawer(<AddFirearmDrawerContent />)
      }}
    >
      <Ionicons
        name='add-circle-outline'
        size={screenWidth >= LARGE_SCREEN_BREAKPOINT ? 32 : 48}
        color={colors.primary}
      />
      <Text preset='label' style={styles.addFirearmText}>
        Add Firearm
      </Text>
    </TouchableOpacity>
  )

  // Content based on screen size
  const renderContent = () => {
    // Show loading state
    if (isLoading && firearms.length === 0) {
      return <ActivityIndicator style={styles.centerMessage} size='large' color={colors.primary} />
    }

    // Show error state
    if (error && firearms.length === 0) {
      return (
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={() => token && fetchInitialFirearms(token)} />
        </View>
      )
    }

    // Display the message if the limit of 2 firearms is reached, before other content
    // This message should appear even if there are firearms, as long as the count is 2.
    const limitMessage = firearms.length === 2 ? (
      <Text style={styles.limitReachedText}>
        {betaMaxFirearmsMessage}
      </Text>
    ) : null;

    // Show empty state (if no firearms and limit not yet reached for the message above)
    if (!isLoading && firearms.length === 0) {
      return (
        <View style={{ flex:1 }}>
          {limitMessage} {/* This will be null here as firearms.length is 0 */}
          <View style={styles.emptyMessage}>
            <Text preset='label'>No firearms found</Text>
            <Button
              variant='secondary'
              title='Add firearm'
              onPress={() => {
                // The canAddFirearm check and Alert for adding is handled by renderAddButton
                openDrawer(<AddFirearmDrawerContent />)
              }}
            />
            <Text preset='caption' style={{ color: colors.textSecondary, marginTop: 8 }}>
              Get started by adding your first firearm.
            </Text>
          </View>
        </View>
      )
    }

    // Show firearm cards
    const actualFirearmsContent = screenWidth < LARGE_SCREEN_BREAKPOINT ? (
      // Horizontal ScrollView for firearms
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {firearms.map(firearm => (
          <FirearmCard
            key={`scroll-${firearm.id}`}
            firearm={firearm}
            onPress={() => handleFirearmPress(firearm)}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
          />
        ))}
        {renderAddButton()}
      </ScrollView>
    ) : (
      // Grid layout for large screens
      <View style={styles.cardsGrid}>
        {firearms.map(firearm => (
          <FirearmCard
            key={`grid-${firearm.id}`}
            firearm={firearm}
            onPress={() => handleFirearmPress(firearm)}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
          />
        ))}
        {renderAddButton()}
      </View>
    );

    return (
      <View style={{ flex: 1 }}>
        {limitMessage} {/* Display the message if the limit of 2 firearms is reached */}
        {/* Loading indicator if still loading more, shown above the list */}
        {isLoading && firearms.length > 0 && <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} />}
        {actualFirearmsContent}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.header}>
          <Text preset='h4'>Firearms</Text>
          <Button variant='ghost' style={{ marginLeft: 'auto' }} title='See All' onPress={() => {}} />
        </View>

        {renderContent()}
      </View>
    </View>
  )
}

export default AllItemsView
