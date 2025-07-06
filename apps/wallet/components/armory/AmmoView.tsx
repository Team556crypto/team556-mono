import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions
} from 'react-native'
import { useAmmoStore } from '@/store/ammoStore'
import { useAuthStore } from '@/store/authStore'
import { AmmoCard, Text, Button, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui' 
import { useTheme } from '@team556/ui'
import { Ammo } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { AmmoDetailsDrawerContent } from '@/components/drawers/AmmoDetailsDrawerContent' 
import { AddAmmoDrawerContent } from '@/components/drawers/AddAmmoDrawerContent' 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const AmmoView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem())
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()

  const getResponsiveLayout = () => {
    let numColumns = 2
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) numColumns = 5
    else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) numColumns = 4
    else if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) numColumns = 3

    const effectiveWidth = screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth
    const availableWidth = effectiveWidth - PADDING * 2 - COLUMN_GAP * (numColumns - 1)
    const cardWidth = Math.max(DEFAULT_CARD_WIDTH, Math.floor(availableWidth / numColumns))
    const cardHeight = Math.floor(cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH))

    return { numColumns, cardWidth, cardHeight }
  }

  const { numColumns, cardWidth, cardHeight } = getResponsiveLayout()
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
  const hasAttemptedInitialFetch = useAmmoStore(state => state.hasAttemptedInitialFetch)
  const clearAmmoError = useAmmoStore(state => state.setError)
  const { openDrawer } = useDrawerStore()

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialAmmos(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialAmmos])

  const handleAmmoPress = (ammo: Ammo) => {
    openDrawer(<AmmoDetailsDrawerContent ammo={ammo} />, { maxHeight: '90%' })
  }

  const handleAddAmmo = () => {
    openDrawer(<AddAmmoDrawerContent />)
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18
    },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flatListContainer: { flex: 1 },
    gridContent: { flexGrow: 1, padding: PADDING },
    columnWrapper: { justifyContent: 'space-between', marginBottom: COLUMN_GAP },
    gridItem: { marginBottom: COLUMN_GAP },
    cardWrapper: { alignItems: 'center' },
    centerMessage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: colors.error, textAlign: 'center', marginBottom: 10 },
    emptyMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    limitReachedText: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginLeft: 8 },
    addButtonLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(128, 90, 213, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 8 },
    addButtonHeaderSmall: { padding: 8, borderRadius: 8 },
    addButtonText: { color: '#805AD5', fontWeight: '600' }
  })

  const renderItem = ({ item }: { item: Ammo }) => (
    <View style={[styles.gridItem, { width: dimensions.cardWidth }]}>
      <View style={styles.cardWrapper}>
        <AmmoCard
          ammo={item}
          onPress={() => handleAmmoPress(item)}
          width={dimensions.cardWidth}
          height={dimensions.cardHeight}
        />
      </View>
    </View>
  )

  let content
  if (isLoading && ammos.length === 0) {
    content = <View style={styles.centerMessage}><ActivityIndicator size='large' color={colors.primary} /></View>
  } else if (ammoStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{ammoStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearAmmoError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (ammos.length === 0) {
    content = (
      <View style={styles.emptyMessage}>
        <MaterialCommunityIcons name='ammunition' size={48} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary }}>No Ammo Yet</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
          Get started by adding your first ammo type to your inventory.
        </Text>
        <Button variant='secondary' title='+ Add Ammo' onPress={handleAddAmmo} disabled={!canAddItem} />
        {!isP1User && !canAddItem && (
          <Text style={styles.limitReachedText}>Item limit reached. P1 presale members have unlimited additions.</Text>
        )}
      </View>
    )
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={ammos}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ? item.id.toString() : `${item.manufacturer}-${item.caliber}-${index}`}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={isLoading && ammos.length > 0 ? <ActivityIndicator style={{ marginVertical: 20 }} size='large' color={colors.primary} /> : null}
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset='h3' accessibilityRole='header'>My Ammo</Text>
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
            <Ionicons name='add' size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} color={colors.primary} />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && <Text style={styles.addButtonText}>Add Ammo</Text>}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}
