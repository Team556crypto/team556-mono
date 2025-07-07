import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useGearStore } from '@/store/gearStore';
import { Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { GearCard, Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui';
import { useTheme } from '@team556/ui';
import { Gear } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import GearDetailsDrawerContent from '@/components/drawers/GearDetailsDrawerContent';
import AddGearDrawerContent from '@/components/drawers/AddGearDrawerContent';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Responsive layout constants
const COLUMN_GAP = 16;
const PADDING = 16;
const SMALL_SCREEN_BREAKPOINT = 480;
const MEDIUM_SCREEN_BREAKPOINT = 768;
const LARGE_SCREEN_BREAKPOINT = 1024;
const XLARGE_SCREEN_BREAKPOINT = 1366;

export const GearView = () => {
  const { colors } = useTheme();
  const token = useAuthStore(state => state.token);
  const canAddItem = useAuthStore(state => state.canAddItem('gear'));
  const isP1User = useAuthStore(state => state.isP1PresaleUser());
  const { width: screenWidth } = useWindowDimensions();

  const getResponsiveLayout = () => {
    let numColumns = 2;
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) numColumns = 5;
    else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) numColumns = 4;
    else if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) numColumns = 3;

    const effectiveWidth = screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth;
    const availableWidth = effectiveWidth - PADDING * 2 - COLUMN_GAP * (numColumns - 1);
    const cardWidth = Math.max(DEFAULT_CARD_WIDTH, Math.floor(availableWidth / numColumns));
    const cardHeight = Math.floor(cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH));

    return { numColumns, cardWidth, cardHeight, effectiveWidth };
  };

  const { numColumns, cardWidth, cardHeight } = getResponsiveLayout();
  const [dimensions, setDimensions] = useState({ cardWidth, cardHeight, numColumns });

  useFocusEffect(
    useCallback(() => {
      const { cardWidth, cardHeight, numColumns } = getResponsiveLayout();
      setDimensions({ cardWidth, cardHeight, numColumns });
    }, [screenWidth])
  );

  const gear = useGearStore(state => state.gear);
  const validGear = Array.isArray(gear) ? gear.filter(item => item && item.id) : [];
  const isLoading = useGearStore(state => state.isLoading);
  const gearStoreError = useGearStore(state => state.error);
  const fetchInitialGear = useGearStore(state => state.fetchInitialGear);
  const deleteGear = useGearStore(state => state.deleteGear);
  const hasAttemptedInitialFetch = useGearStore(
    state => state.hasAttemptedInitialFetch,
  );
  const clearGearError = useGearStore(state => state.setError);
  const { openDrawer, closeDrawer } = useDrawerStore();


  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialGear(token);
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialGear]);

  const handleGearPress = (gear: Gear) => {
    openDrawer(<GearDetailsDrawerContent gearId={gear.id} closeDrawer={closeDrawer} openDrawer={openDrawer} />, { maxHeight: '90%' });
  };

  const handleAddGear = () => {
    openDrawer(<AddGearDrawerContent closeDrawer={closeDrawer} />);
  };

  const handleDelete = (gearId: number) => {
    Alert.alert(
      'Delete Gear',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteGear(gearId, token);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete gear item.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false },
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      paddingHorizontal: PADDING
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    flatListContainer: {
      flex: 1,
      overflow: 'visible'
    },
    gridContent: {
      paddingBottom: 40
    },
    columnWrapper: {
      gap: COLUMN_GAP,
      justifyContent: 'flex-start',
      marginBottom: COLUMN_GAP * 1.5
    },
    gridItem: {
      margin: COLUMN_GAP / 2,
      alignItems: 'center',
    },
    cardWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    },
    centerMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginTop: 8
    },
    limitReachedText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: 8,
      paddingHorizontal: 16
    },

    addButton: {
      borderRadius: 8
    },
    addButtonHeaderSmall: {
      padding: 8,
      borderRadius: 8
    },
    addButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(128, 90, 213, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8
    },
    addButtonText: {
      color: '#805AD5',
      fontWeight: '600'
    }
  });

  const renderItem = ({ item }: { item: Gear }) => (
    <View style={[styles.gridItem, { width: dimensions.cardWidth }]}>
      <View style={styles.cardWrapper}>
        <GearCard
          gear={item}
          onPress={() => handleGearPress(item)}
          onDelete={() => handleDelete(item.id)}
          width={dimensions.cardWidth}
          height={dimensions.cardHeight}
        />
      </View>
    </View>
  );

  let content = null;

  if (isLoading && validGear.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (gearStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{gearStoreError}</Text>
        <Button variant="outline" title="Dismiss" onPress={() => clearGearError(null)} style={{ marginTop: 16 }} />
      </View>
    );
  } else if (validGear.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='tent' size={80} color={colors.primary} />}
        title='No Gear Yet'
        subtitle='Get started by adding your first piece of gear to your armory.'
        buttonText='+ Add Gear'
        onPress={handleAddGear}
      />
    );
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={validGear}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={isLoading && validGear.length > 0 ? <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} /> : null}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset="h3" accessibilityRole="header">
            My Gear
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${validGear.length})`}</Text>
          {!isP1User && !canAddItem && validGear.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity
            onPress={handleAddGear}
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall}
          >
            <Ionicons name="add" size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} color={colors.primary} />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && <Text style={styles.addButtonText}>Add Gear</Text>}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  );
};
