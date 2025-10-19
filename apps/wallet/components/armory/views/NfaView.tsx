import React, { useEffect } from 'react'
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Platform
} from 'react-native'
import { useAuthStore } from '@/store/authStore'
import { Text, Button, EmptyState } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { NFA } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useNFAStore } from '@/store/nfaStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { NFADetailsDrawerContent } from '@/components/drawers/armory/details/NFADetailsDrawerContent';
import { AddNFADrawerContent } from '@/components/drawers/armory/add/AddNFADrawerContent';
import NFACard from '../cards/NFACard';
import { viewStyles } from './styles';

// Responsive layout constants
const COLUMN_GAP = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const NFAView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('gear'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()
  const styles = viewStyles(colors, COLUMN_GAP)

  const getResponsiveLayout = () => {
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) return 5;
    if (screenWidth >= LARGE_SCREEN_BREAKPOINT) return 4;
    if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) return 3;
    return 2; // Default for small screens
  };

  const numColumns = getResponsiveLayout();

  const nfas = useNFAStore(state => state.nfaItems)
  const isLoading = useNFAStore(state => state.isLoading)
  const nfaStoreError = useNFAStore(state => state.error)
  const fetchInitialNFAItems = useNFAStore(state => state.fetchInitialNFAItems)
  const deleteNFAItem = useNFAStore(state => state.deleteNFAItem)
  const hasAttemptedInitialFetch = useNFAStore(state => state.hasAttemptedInitialFetch)
  const clearNFAError = useNFAStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialNFAItems(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialNFAItems])

  const handleNfaPress = (nfa: NFA) => {
    openDrawer(<NFADetailsDrawerContent nfa={nfa} />, { maxHeight: '90%' });
  }

  const handleAddNFA = () => {
    openDrawer(<AddNFADrawerContent />);
  }

  const handleDelete = (nfaId: number) => {
    console.log('handleDelete called with nfaId:', nfaId);
    
    const performDelete = () => {
      deleteNFAItem(nfaId, token).catch(error => {
        console.error('Failed to delete NFA item:', error);
        if (Platform.OS === 'web') {
          alert('Failed to delete NFA item.');
        } else {
          Alert.alert('Error', 'Failed to delete NFA item.');
        }
      });
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this NFA item? This action cannot be undone.')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete NFA Item',
        'Are you sure you want to delete this NFA item? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', onPress: performDelete, style: 'destructive' },
        ],
        { cancelable: false }
      );
    }
  }

  const renderItem = ({ item }: { item: NFA }) => (
    <View style={{ flex: 1, margin: COLUMN_GAP / 2 }}>
      <NFACard
        nfa={item}
        onPress={() => handleNfaPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </View>
  );

  let content = null

  if (isLoading && nfas.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if ( nfaStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{nfaStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearNFAError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (nfas.length === 0) {
    content = (
      <EmptyState
        icon={<MaterialCommunityIcons name='crosshairs' size={80} color={colors.primary} />}
        title='No NFA Items Yet'
        subtitle='Get started by adding your first NFA item to your armory.'
        buttonText='+ Add NFA Item'
        onPress={handleAddNFA}
      />
    )
  } else {
    const FlatList = require('react-native').FlatList;
    content = (
      <FlatList
        key={numColumns}
        data={nfas}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && nfas.length > 0 ? (
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
            NFA Items
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${nfas.length})`}</Text>
          {!isP1User && !canAddItem && nfas.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddNFA} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add NFA Item</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}