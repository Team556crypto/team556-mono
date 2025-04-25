import React from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { ScreenLayout } from '@/components/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'

export default function TermsScreen() {
  const router = useRouter()
  const headerElement = (
    <TouchableOpacity onPress={() => router.push('/settings')}>
      <Ionicons name='close' size={30} color={Colors.text} />
    </TouchableOpacity>
  )
  return (
    <ScreenLayout
      title='Terms of Service'
      headerRightElement={headerElement}
      headerIcon={<Ionicons name='document' size={24} color={Colors.tint} />}
    >
      <></>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({})
