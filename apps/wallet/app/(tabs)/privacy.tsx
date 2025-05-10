import React from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { Colors } from '@/constants/Colors'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'

export default function PrivacyScreen() {
  const router = useRouter()
  const headerElement = (
    <TouchableOpacity onPress={() => router.push('/settings')}>
      <Ionicons name='close' size={30} color={Colors.text} />
    </TouchableOpacity>
  )
  return (
    <ScreenLayout
      title='Privacy Policy'
      headerRightElement={headerElement}
      headerIcon={<Ionicons name='settings' size={24} color={Colors.tint} />}
    >
      <Head>
        <title>Privacy Policy | Team556 Wallet</title>
      </Head>
      <></>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({})
