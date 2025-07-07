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
import { useNFAStore } from '@/store/nfaStore'
import { useAuthStore } from '@/store/authStore'
import { NFACard, Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { NFA } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';

import { NFADetailsDrawerContent } from '@/components/drawers/NFADetailsDrawerContent';
import { AddNFADrawerContent } from '@/components/drawers/AddNFADrawerContent';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const SMALL_SCREEN_BREAKPOINT = 480
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const NfaView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('nfa'))
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

  const nfaItems = useNFAStore(state => state.nfaItems)
  const isLoading = useNFAStore(state => state.isLoading)
  const nfaStoreError = useNFAStore(state => state.error)
  const fetchInitialNFAItems = useNFAStore(state => state.fetchInitialNFAItems)
  const deleteNFAItem = useNFAStore(state => state.deleteNFAItem)
  const hasAttemptedInitialFetch = useNFAStore(state => state.hasAttemptedInitialFetch)
  const clearNFAError = useNFAStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialNFAItems(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialNFAItems])

  const handleNFAPress = (nfaItem: NFA) => {
    openDrawer(<NFADetailsDrawerContent nfaItem={nfaItem} />, { maxHeight: '90%' });
  }

  const handleAddNFA = () => {
    openDrawer(<AddNFADrawerContent />);
  }

  const handleDelete = (nfaId: number) => {
    Alert.alert(
      'Delete NFA Item',
      'Are you sure you want to delete this NFA item? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteNFAItem(nfaId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete NFA item.');
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

  const renderItem = ({ item }: { item: NFA }) => {
    return (
      <View style={[styles.gridItem, { width: dimensions.cardWidth }]}> 
        <View style={styles.cardWrapper}>
          <NFACard
            nfa={item}
            onPress={() => handleNFAPress(item)}
            onDelete={() => handleDelete(item.id)}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
          />
        </View>
      </View>
    )
  }

  let content = null

  if (isLoading && nfaItems.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (nfaStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{nfaStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearNFAError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (nfaItems.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='file-certificate-outline' size={80} color={colors.primary} />}
        title='No NFA Items Yet'
        subtitle='Get started by adding your first NFA item to your armory.'
        buttonText='+ Add NFA Item'
        onPress={handleAddNFA}
      />
    )
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={nfaItems}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && nfaItems.length > 0 ? (
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
            My NFA Items
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${nfaItems.length})`}</Text>
          {!isP1User && !canAddItem && nfaItems.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddNFA} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add NFA Item</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}
