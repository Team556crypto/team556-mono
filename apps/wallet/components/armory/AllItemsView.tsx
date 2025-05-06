import React, { useEffect } from 'react'
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Badge, Button } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Firearm } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import { FirearmDetailsDrawerContent } from './FirearmDetailsDrawerContent'

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
    }
  })

  if (isLoading && firearms.length === 0) {
    return (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>Error loading firearms: {error}</Text>
      </View>
    )
  }

  if (!isLoading && firearms.length === 0) {
    return (
      <View style={styles.centerMessage}>
        <Text>No firearms found in your armory.</Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {firearms.map(firearm => (
            <FirearmCard key={firearm.id} firearm={firearm} onPress={() => handleFirearmPress(firearm)} />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

export default AllItemsView
