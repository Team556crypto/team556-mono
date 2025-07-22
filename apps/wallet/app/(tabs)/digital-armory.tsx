import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@team556/ui';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HorizontalBadgeScroll, BadgeItem } from '@team556/ui';

import { FirearmsView } from '@/components/armory/views/FirearmsView';
import { AmmoView } from '@/components/armory/views/AmmoView';
import { GearView } from '@/components/armory/views/GearView';
import { DocumentsView } from '@/components/armory/views/DocumentsView';
import { NFAView } from '@/components/armory/views/NfaView';
import AllItemsView from '@/components/armory/views/AllItemsView';

export default function DigitalArmoryScreen() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const CATEGORIES: BadgeItem[] = [
    { label: 'All', icon: <Ionicons name='grid' size={16} color={selectedCategory === 'All' ? colors.background : colors.primary} /> },
    { label: 'Firearms', icon: <MaterialCommunityIcons name='pistol' size={16} color={selectedCategory === 'Firearms' ? colors.background : colors.primary} /> },
    { label: 'Ammo', icon: <MaterialCommunityIcons name='ammunition' size={16} color={selectedCategory === 'Ammo' ? colors.background : colors.primary} /> },
    { label: 'Gear', icon: <MaterialCommunityIcons name='tent' size={16} color={selectedCategory === 'Gear' ? colors.background : colors.primary} /> },
    { label: 'NFA', icon: <MaterialCommunityIcons name='file-certificate-outline' size={16} color={selectedCategory === 'NFA' ? colors.background : colors.primary} /> },
    { label: 'Documents', icon: <Ionicons name='document-text' size={16} color={selectedCategory === 'Documents' ? colors.background : colors.primary} /> },
  ];
  
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
        return <NFAView />;
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
      <View style={[styles.container]}>{renderSelectedView()}</View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 22
  }
})
