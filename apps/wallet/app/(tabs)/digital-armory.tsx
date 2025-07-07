import React, { useState, useRef, useCallback } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { HorizontalBadgeScroll, BadgeItem } from '@team556/ui'

import { FirearmsView } from '@/components/armory/FirearmsView'
import { AmmoView } from '@/components/armory/AmmoView';
import { GearView } from '@/components/armory/GearView';
import { DocumentsView } from '@/components/armory/DocumentsView'
import { NfaView } from '@/components/armory/NfaView'
import AllItemsView from '@/components/armory/AllItemsView'
import AddGearDrawerContent from '@/components/drawers/AddGearDrawerContent'
import GearDetailsDrawerContent from '@/components/drawers/GearDetailsDrawerContent'

const CATEGORIES: BadgeItem[] = [
  { label: 'All', icon: <Ionicons name='grid' size={16} color={Colors.textSecondary} /> },
  { label: 'Firearms', icon: <MaterialCommunityIcons name='pistol' size={16} color={Colors.textSecondary} /> },
  { label: 'Ammo', icon: <MaterialCommunityIcons name='ammunition' size={16} color={Colors.textSecondary} /> },
  { label: 'Gear', icon: <MaterialCommunityIcons name='tent' size={16} color={Colors.textSecondary} /> },
  { label: 'Documents', icon: <Ionicons name='document-text' size={16} color={Colors.textSecondary} /> },
  { label: 'NFA', icon: <MaterialCommunityIcons name='file-certificate-outline' size={16} color={Colors.textSecondary} /> },
]

export default function DigitalArmoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].label)
  const [activeDrawer, setActiveDrawer] = useState<{ type: string; props: any } | null>(null)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const openDrawer = useCallback((type: string, props: any) => {
    setActiveDrawer({ type, props });
    bottomSheetModalRef.current?.present();
  }, []);

  const closeDrawer = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const renderSelectedView = () => {
    switch (selectedCategory) {
      case 'Firearms':
        return <FirearmsView />
      case 'Ammo':
        return <AmmoView />;
      case 'Gear':
        return <GearView openDrawer={openDrawer} />;
      case 'Documents':
        return <DocumentsView />
      case 'NFA':
        return <NfaView />
      case 'All':
      default:
        return <AllItemsView onCategorySelect={setSelectedCategory} />
    }
  }

  const renderDrawerContent = () => {
    if (!activeDrawer) return null;

    switch (activeDrawer.type) {
      case 'AddGear':
        return <AddGearDrawerContent {...activeDrawer.props} closeDrawer={closeDrawer} />;
      case 'GearDetails':
        return <GearDetailsDrawerContent {...activeDrawer.props} closeDrawer={closeDrawer} openDrawer={openDrawer} />;
      default:
        return null;
    }
  };

  const isScrollableView = ['All', 'Firearms', 'Ammo', 'Gear'].includes(selectedCategory);

  return (
    <BottomSheetModalProvider>
      <ScreenLayout
        title='Digital Armory'
        headerIcon={<Ionicons name='shield-checkmark' size={24} color={Colors.primary} />}
        scrollEnabled={!isScrollableView}
      >
        <HorizontalBadgeScroll items={CATEGORIES} initialSelectedItem={selectedCategory} onSelect={setSelectedCategory} />
        <View style={styles.container}>{renderSelectedView()}</View>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={['85%']}
          backgroundStyle={{ backgroundColor: Colors.backgroundDark }}
          handleIndicatorStyle={{ backgroundColor: Colors.textSecondary }}
        >
          {renderDrawerContent()}
        </BottomSheetModal>
      </ScreenLayout>
    </BottomSheetModalProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 22
  }
})
