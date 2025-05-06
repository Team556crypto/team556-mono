import React, { useEffect } from 'react'
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useFirearmStore } from '@/store/firearmStore'
import { useAuthStore } from '@/store/authStore'
import { FirearmCard, Text, Badge } from '@team556/ui'
import { useTheme } from '@team556/ui'

const AllItemsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)

  const firearms = useFirearmStore(state => state.firearms)
  const isLoading = useFirearmStore(state => state.isLoading)
  const error = useFirearmStore(state => state.error)
  const fetchInitialFirearms = useFirearmStore(state => state.fetchInitialFirearms)
  const hasAttemptedInitialFetch = useFirearmStore(state => state.hasAttemptedInitialFetch)

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialFirearms(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialFirearms])

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    scrollViewContent: {
      paddingVertical: 16,
      gap: 14
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
        <Text preset='h4'>Firearms</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {firearms.map(firearm => (
            <FirearmCard key={firearm.id} firearm={firearm} />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

export default AllItemsView
