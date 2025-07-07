import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@team556/ui';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HorizontalBadgeScroll, BadgeItem } from '@team556/ui';

import { FirearmsView } from '@/components/armory/FirearmsView';
import { AmmoView } from '@/components/armory/AmmoView';
import { GearView } from '@/components/armory/GearView';
import { DocumentsView } from '@/components/armory/DocumentsView';
import { NfaView } from '@/components/armory/NfaView';
import AllItemsView from '@/components/armory/AllItemsView';

export default function DigitalArmoryScreen() {
  const { colors } = useTheme();

  const CATEGORIES: BadgeItem[] = [
    { label: 'All', icon: <Ionicons name='grid' size={16} color={colors.primary} /> },
    { label: 'Firearms', icon: <MaterialCommunityIcons name='pistol' size={16} color={colors.primary} /> },
    { label: 'Ammo', icon: <MaterialCommunityIcons name='ammunition' size={16} color={colors.primary} /> },
    { label: 'Gear', icon: <MaterialCommunityIcons name='tent' size={16} color={colors.primary} /> },
    { label: 'NFA', icon: <MaterialCommunityIcons name='file-certificate-outline' size={16} color={colors.primary} /> },
    { label: 'Documents', icon: <Ionicons name='document-text' size={16} color={colors.primary} /> },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].label);

  const renderSelectedView = () => {
    switch (selectedCategory) {
      case 'Firearms':
        return <FirearmsView />;
      case 'Ammo':
        return <AmmoView />;
      case 'Gear':
        return <GearView />;
      case 'Documents':
        return <DocumentsView />;
      case 'NFA':
        return <NfaView />;
      case 'All':
      default:
        return <AllItemsView onCategorySelect={setSelectedCategory} />;
    }
  };

  const isScrollableView = ['All', 'Firearms', 'Ammo', 'Gear', 'NFA', 'Documents'].includes(selectedCategory);

  return (
    <ScreenLayout
      title='Digital Armory'
      headerIcon={<Ionicons name='shield-checkmark' size={24} color={colors.primary} />}
      scrollEnabled={!isScrollableView}
    >
      <HorizontalBadgeScroll items={CATEGORIES} initialSelectedItem={selectedCategory} onSelect={setSelectedCategory} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>{renderSelectedView()}</View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 22
  }
})
