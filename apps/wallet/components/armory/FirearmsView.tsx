import React, { useEffect } from 'react'
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Button } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { FirearmDetailsDrawerContent } from '@/components/drawers/FirearmDetailsDrawerContent'
import { AddFirearmDrawerContent } from '@/components/drawers/AddFirearmDrawerContent'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')
const COLUMN_GAP = 16
const NUM_COLUMNS = 2
const ITEM_WIDTH = (width - COLUMN_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS

export const FirearmsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)

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

  const renderItem = ({ item }: { item: Firearm }) => {
    return (
      <View style={styles.gridItem}>
        <View style={styles.cardWrapper}>
          <FirearmCard firearm={item} onPress={() => handleFirearmPress(item)} />
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
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Disable scroll on FlatList to prevent nested scrolling
          // Instead of using contentContainerStyle with padding, we'll use a fixed height container
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text preset='h4'>Firearms</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFirearm}>
          <Ionicons name='add' size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
    // padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  flatListContainer: {
    flex: 1
    // Fixed height container that allows content to flow naturally
    // without creating a nested scrolling situation
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP
  },
  gridItem: {
    width: ITEM_WIDTH
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
    borderColor: '#444',
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 12,
    paddingVertical: 48
  },
  addButton: {
    padding: 8
  }
})
