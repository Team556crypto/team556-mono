import React, { useEffect } from 'react'
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Badge, Button } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { FirearmDetailsDrawerContent } from './FirearmDetailsDrawerContent'
import { Ionicons } from '@expo/vector-icons'
import { CARD_HEIGHT, CARD_WIDTH } from '@team556/ui'

const AllItemsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)

  const firearms = useFirearmStore(state => state.firearms)
  const isLoading = useFirearmStore(state => state.isLoading)
  const error = useFirearmStore(state => state.error)
  const fetchInitialFirearms = useFirearmStore(state => state.fetchInitialFirearms)
  const hasAttemptedInitialFetch = useFirearmStore(state => state.hasAttemptedInitialFetch)
  const openDrawer = useDrawerStore(state => state.openDrawer)

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
    scrollViewContent: {
      paddingVertical: 16,
      gap: 14
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
    emptyMessage: {
      flexGrow: 1,
      width: '100%',
      marginTop: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.background,
      backgroundColor: colors.backgroundDark,
      gap: 12,
      paddingVertical: 24
    },
    addFirearmCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.background,
      backgroundColor: colors.backgroundSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      marginRight: 16,
      padding: 16
    },
    addFirearmText: {
      color: colors.primary,
      marginTop: 8
    }
  })

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.header}>
          <Text preset='h4'>Firearms</Text>
          <Button variant='ghost' style={{ marginLeft: 'auto' }} title='See All' onPress={() => {}} />
        </View>

        {isLoading && firearms.length === 0 && <ActivityIndicator size='large' color={colors.primary} />}
        {!isLoading && firearms.length === 0 && (
          <View style={styles.emptyMessage}>
            <Text preset='label'>No firearms found</Text>
            <Button variant='secondary' title='Add firearm' onPress={() => {}} />
          </View>
        )}
        {error && <Text style={styles.errorText}>Error loading firearms: {error}</Text>}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {!isLoading &&
            firearms.length > 0 &&
            firearms.map(firearm => (
              <FirearmCard key={firearm.id} firearm={firearm} onPress={() => handleFirearmPress(firearm)} />
            ))}
          {!isLoading && firearms.length >= 0 && (
            <TouchableOpacity style={styles.addFirearmCard} onPress={() => console.log('Add new firearm pressed')}>
              <Ionicons name='add-circle-outline' size={48} color={colors.primary} />
              <Text preset='label' style={styles.addFirearmText}>
                Add Firearm
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default AllItemsView
