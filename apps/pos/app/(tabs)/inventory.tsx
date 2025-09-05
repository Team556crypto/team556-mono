import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@team556/ui';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';

export default function Inventory() {
  const { colors } = useTheme();

  return (
    <ScreenLayout
      title='Inventory'
      headerIcon={<Ionicons name='shield-checkmark' size={24} color={colors.primary} />}
    >
      <View style={[styles.container]}></View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 22
  }
})