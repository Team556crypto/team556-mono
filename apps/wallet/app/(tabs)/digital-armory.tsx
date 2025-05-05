import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { HorizontalBadgeScroll } from '@team556/ui'; 

import { AllItemsView } from '@/components/armory/AllItemsView';
import { FirearmsView } from '@/components/armory/FirearmsView';
import { AmmoView } from '@/components/armory/AmmoView';
import { DocumentsView } from '@/components/armory/DocumentsView';
import { NfaView } from '@/components/armory/NfaView';

const CATEGORIES = ['All', 'Firearms', 'Ammo', 'Documents', 'NFA'];

export default function DigitalArmoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);

  const renderSelectedView = () => {
    switch (selectedCategory) {
      case 'Firearms':
        return <FirearmsView />;
      case 'Ammo':
        return <AmmoView />;
      case 'Documents':
        return <DocumentsView />;
      case 'NFA':
        return <NfaView />;
      case 'All':
      default:
        return <AllItemsView />;
    }
  };

  return (
    <ScreenLayout
      title='Digital Armory'
      headerIcon={<Ionicons name='shield-checkmark' size={24} color={Colors.primary} />}
    >
      <HorizontalBadgeScroll items={CATEGORIES} initialSelectedItem={selectedCategory} onSelect={setSelectedCategory} />
      <View style={styles.container}>{renderSelectedView()}</View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
