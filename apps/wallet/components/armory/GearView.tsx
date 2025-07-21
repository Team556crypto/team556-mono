import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Gear } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useGearStore } from '@/store/gearStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { GearDetailsDrawerContent } from '@/components/drawers/GearDetailsDrawerContent';
import { AddGearDrawerContent } from '@/components/drawers/AddGearDrawerContent';
import GearCard from './GearCard';

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const GearView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('gear'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()

  // Responsive sizing based on screen width
  const getResponsiveLayout = () => {
    let numColumns = 2 // Default for small screens

    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) {
      numColumns = 5
    } else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) {
      numColumns = 4
    } else if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) {
      numColumns = 3
    }

    // Calculate container width (accounting for the sidebar on large screens)
    const effectiveWidth = screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth

    // Calculate available width for grid (minus padding and gap)
    const availableWidth = effectiveWidth - PADDING * 2 - COLUMN_GAP * (numColumns - 1)

    // Card width is calculated based on available space
    const cardWidth = Math.max(DEFAULT_CARD_WIDTH, Math.floor(availableWidth / numColumns))

    // Calculate cardHeight proportionally
    const cardHeight = Math.floor(cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH))

    return { numColumns, cardWidth, cardHeight, effectiveWidth }
  }

  const { numColumns, cardWidth, cardHeight } = getResponsiveLayout()

  // Listen for screen dimension changes
  const [dimensions, setDimensions] = useState({ cardWidth, cardHeight, numColumns })

  useFocusEffect(
    useCallback(() => {
      const { cardWidth, cardHeight, numColumns } = getResponsiveLayout()
      setDimensions({ cardWidth, cardHeight, numColumns })
    }, [screenWidth])
  )

  const gears = useGearStore(state => state.gear)
  const isLoading = useGearStore(state => state.isLoading)
  const gearStoreError = useGearStore(state => state.error)
  const fetchInitialGears = useGearStore(state => state.fetchInitialGear)
  const deleteGear = useGearStore(state => state.deleteGear)
  const hasAttemptedInitialFetch = useGearStore(state => state.hasAttemptedInitialFetch)
  const clearGearError = useGearStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialGears(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialGears])

  const handleGearPress = (gear: Gear) => {
    openDrawer(<GearDetailsDrawerContent gear={gear} />, { maxHeight: '90%' });
  }

  const handleAddGear = () => {
    openDrawer(<AddGearDrawerContent />);
  }

  const handleDelete = (gearId: number) => {
    Alert.alert(
      'Delete Gear',
      'Are you sure you want to delete this gear? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteGear(gearId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete gear.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    )
  }

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
    emptyMessage: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.backgroundLight,
      backgroundColor: 'rgba(0,0,0,0.2)',
      gap: 12,
      paddingVertical: 48
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
  })

  const renderItem = ({ item }: { item: Gear }) => {
    return (
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
    )
  }

  let content = null

  if (isLoading && gears.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (gearStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{gearStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearGearError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (gears.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='pistol' size={80} color={colors.primary} />}
        title='No Ammunition Yet'
        subtitle='Get started by adding your first ammunition to your armory.'
        buttonText='+ Add Ammunition'
        onPress={handleAddGear}
      />
    )
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={gears}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && gears.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 20 }} size='large' color={colors.primary} />
          ) : null
        }
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text preset='h3' accessibilityRole='header'>
            My Ammunition
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${gears.length})`}</Text>
          {!isP1User && !canAddItem && gears.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddGear} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add Ammunition</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}



// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   ActivityIndicator,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   useWindowDimensions,
//   Alert
// } from 'react-native';
// import { useAuthStore } from '@/store/authStore';
// import { Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui';
// import GearCard from './GearCard';
// import { useTheme } from '@team556/ui';
// import { Gear } from '@/services/api';
// import { useDrawerStore } from '@/store/drawerStore';
// import { useGearStore } from '@/store/gearStore';

// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
// import { GearDetailsDrawerContent } from '@/components/drawers/GearDetailsDrawerContent';
// import { AddGearDrawerContent } from '@/components/drawers/AddGearDrawerContent';

// // Responsive layout constants
// const COLUMN_GAP = 16;
// const PADDING = 16;
// const MEDIUM_SCREEN_BREAKPOINT = 768;
// const LARGE_SCREEN_BREAKPOINT = 1024;
// const XLARGE_SCREEN_BREAKPOINT = 1366;

// export const GearView = () => {
//   const { colors } = useTheme();
//   const token = useAuthStore(state => state.token);
//   const canAddItem = useAuthStore(state => state.canAddItem('gear'));
//   const { width: screenWidth } = useWindowDimensions();

//   // Responsive sizing based on screen width
//   const getResponsiveLayout = () => {
//     let numColumns = 2; // Default for small screens

//     if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) {
//       numColumns = 5;
//     } else if (screenWidth >= LARGE_SCREEN_BREAKPOINT) {
//       numColumns = 4;
//     } else if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) {
//       numColumns = 3;
//     }

//     const effectiveWidth = screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? screenWidth - 240 : screenWidth;
//     const availableWidth = effectiveWidth - PADDING * 2 - COLUMN_GAP * (numColumns - 1);
//     const cardWidth = Math.max(DEFAULT_CARD_WIDTH, Math.floor(availableWidth / numColumns));
//     const cardHeight = Math.floor(cardWidth * (DEFAULT_CARD_HEIGHT / DEFAULT_CARD_WIDTH));

//     return { numColumns, cardWidth, cardHeight, effectiveWidth };
//   };

//   const { numColumns, cardWidth, cardHeight } = getResponsiveLayout();

//   const [dimensions, setDimensions] = useState({ cardWidth, cardHeight, numColumns });

//   useFocusEffect(
//     useCallback(() => {
//       const { cardWidth, cardHeight, numColumns } = getResponsiveLayout();
//       setDimensions({ cardWidth, cardHeight, numColumns });
//     }, [screenWidth])
//   );

//   const gears = useGearStore(state => state.gear);
//   const isLoading = useGearStore(state => state.isLoading);
//   const gearStoreError = useGearStore(state => state.error);
//   const fetchInitialGear = useGearStore(state => state.fetchInitialGear);
//   const deleteGear = useGearStore(state => state.deleteGear);
//   const hasAttemptedInitialFetch = useGearStore(state => state.hasAttemptedInitialFetch);
//   const clearGearError = useGearStore(state => state.setError);
//   const { openDrawer } = useDrawerStore();

//   useEffect(() => {
//     if (token && !hasAttemptedInitialFetch && !isLoading) {
//       fetchInitialGear(token);
//     }
//   }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialGear]);

//   const handleGearPress = (gear: Gear) => {
//     openDrawer(<GearDetailsDrawerContent gear={gear} />, { maxHeight: '90%' });
//   };

//   const handleAddGear = () => {
//     openDrawer(<AddGearDrawerContent />);
//   };

//   const handleDelete = (gearId: number) => {
//     Alert.alert(
//       'Delete Gear',
//       'Are you sure you want to delete this gear?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Delete', style: 'destructive', onPress: () => token && deleteGear(gearId, token) }
//       ]
//     );
//   };

//   const handleRetry = () => {
//     clearGearError(null);
//     if (token) {
//       fetchInitialGear(token);
//     }
//   };

//   if (isLoading && !hasAttemptedInitialFetch) {
//     return (
//       <View style={styles.centeredContainer}>
//         <ActivityIndicator size="large" color={colors.primary} />
//         <Text style={{ marginTop: 10 }}>Loading Gear...</Text>
//       </View>
//     );
//   }

//   if (gearStoreError) {
//     return (
//       <View style={styles.centeredContainer}>
//         <EmptyState
//           icon={<MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />}
//           title="Error Loading Gear"
//           subtitle={gearStoreError}
//           buttonText="Retry"
//           onPress={handleRetry}
//         />
//       </View>
//     );
//   }

//   if (gears.length === 0 && !isLoading) {
//     return (
//       <View style={styles.centeredContainer}>
//         <EmptyState
//           icon={<MaterialCommunityIcons name="toolbox-outline" size={48} color={colors.textSecondary} />}
//           title="No Gear Found"
//           subtitle="You haven't added any gear yet."
//           buttonText="Add Gear"
//           onPress={handleAddGear}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={gears}
//         key={dimensions.numColumns} // Re-render on column change
//         numColumns={dimensions.numColumns}
//         contentContainerStyle={styles.listContentContainer}
//         columnWrapperStyle={{ gap: COLUMN_GAP }}
//         renderItem={({ item }) => (
//           <View style={{ width: dimensions.cardWidth, marginBottom: COLUMN_GAP }}>
//             <GearCard
//               gear={item}
//               onPress={() => handleGearPress(item)}
//               onDelete={() => handleDelete(item.id)}
//               width={dimensions.cardWidth}
//               height={dimensions.cardHeight}
//             />
//           </View>
//         )}
//         keyExtractor={item => item.id.toString()}
//         ListHeaderComponent={
//           <View style={styles.header}>
//             <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Gear</Text>
//             {canAddItem && (
//               <TouchableOpacity onPress={handleAddGear} style={[styles.addButton, { backgroundColor: colors.primary }]}>
//                 <Ionicons name="add" size={24} color={colors.background} />
//               </TouchableOpacity>
//             )}
//           </View>
//         }
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'transparent'
//   },
//   centeredContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: PADDING
//   },
//   listContentContainer: {
//     padding: PADDING
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16
//   },
//   addButton: {
//     padding: 8,
//     borderRadius: 50
//   }
// });