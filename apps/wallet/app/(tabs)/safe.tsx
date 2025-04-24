import React from 'react'
import { SafeAreaView, StyleSheet, ScrollView } from 'react-native'
import { Colors } from '@/constants/Colors'

export default function SafeScreen() {
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView style={{ padding: 14, marginBottom: 50 }}></ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({})
