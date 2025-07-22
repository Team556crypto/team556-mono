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
import { Document } from '@/services/api';
import { useDrawerStore } from '@/store/drawerStore';
import { useDocumentStore } from '@/store/documentStore';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
// import { DocumentDetailsDrawerContent } from '@/components/drawers/DocumentDetailsDrawerContent';
// import { AddDocumentDrawerContent } from '@/components/drawers/AddDocumentDrawerContent';
import DocumentCard from './DocumentCard';

// Responsive layout constants
const COLUMN_GAP = 16
const PADDING = 16
const MEDIUM_SCREEN_BREAKPOINT = 768
const LARGE_SCREEN_BREAKPOINT = 1024
const XLARGE_SCREEN_BREAKPOINT = 1366

export const DocumentsView = () => {
  const { colors } = useTheme()
  const token = useAuthStore(state => state.token)
  const canAddItem = useAuthStore(state => state.canAddItem('ammo'))
  const isP1User = useAuthStore(state => state.isP1PresaleUser())
  const { width: screenWidth } = useWindowDimensions()

  const getResponsiveLayout = () => {
    if (screenWidth >= XLARGE_SCREEN_BREAKPOINT) return 5;
    if (screenWidth >= LARGE_SCREEN_BREAKPOINT) return 4;
    if (screenWidth >= MEDIUM_SCREEN_BREAKPOINT) return 3;
    return 2; // Default for small screens
  };

  const numColumns = getResponsiveLayout();

  const documents = useDocumentStore(state => state.documents)
  const isLoading = useDocumentStore(state => state.isLoading)
  const documentStoreError = useDocumentStore(state => state.error)
  const fetchInitialDocuments = useDocumentStore(state => state.fetchInitialDocuments)
  const deleteDocument = useDocumentStore(state => state.deleteDocument)
  const hasAttemptedInitialFetch = useDocumentStore(state => state.hasAttemptedInitialFetch)
  const clearDocumentError = useDocumentStore(state => state.setError);
  const { openDrawer } = useDrawerStore();
  

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialDocuments(token)
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialDocuments])

  const handleDocumentPress = (document: Document) => {
    // openDrawer(<DocumentDetailsDrawerContent document={document} />, { maxHeight: '90%' });
  }

  const handleAddDocument = () => {
    // openDrawer(<AddDocumentDrawerContent />);
  }

  const handleDelete = (documentId: number) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDocument(documentId, token)
            } catch (error) {
              // Error is already handled in the store, but you could add specific UI feedback here if needed
              Alert.alert('Error', 'Failed to delete document.');
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
      height: '100%',
      backgroundColor: colors.backgroundDarker
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1,
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

  const renderItem = ({ item }: { item: Document }) => (
    <View style={{ flex: 1, margin: COLUMN_GAP / 2 }}>
      <DocumentCard
        document={item}
        onPress={() => handleDocumentPress(item)}
        onDelete={() => handleDelete(item.id)}
      />
    </View>
  );

  let content = null

  if (isLoading && documents.length === 0) {
    content = (
      <View style={styles.centerMessage}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  } else if (documentStoreError) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{documentStoreError}</Text>
        <Button variant='outline' title='Dismiss' onPress={() => clearDocumentError(null)} style={{ marginTop: 16 }} />
      </View>
    )
  } else if (documents.length === 0) {
    content = (
      <EmptyState
        icon={<Ionicons name='document-text' size={80} color={colors.primary} />}
        title='No Documents Yet'
        subtitle='Get started by adding your first document to your armory.'
        buttonText='+ Add Document'
        onPress={handleAddDocument}
      />
    )
  } else {
    content = (
      <FlatList
        key={numColumns}
        data={documents}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={
          isLoading && documents.length > 0 ? (
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
            My Documents
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>{`(${documents.length})`}</Text>
          {!isP1User && !canAddItem && documents.length >= 2 && (
            <Text style={styles.limitReachedText}>(Max 2 items)</Text>
          )}
        </View>
        {canAddItem && (
          <TouchableOpacity 
            onPress={handleAddDocument} 
            style={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? styles.addButtonLarge : styles.addButtonHeaderSmall} 
          >
            <Ionicons 
              name='add' 
              size={screenWidth >= MEDIUM_SCREEN_BREAKPOINT ? 20 : 24} 
              color={colors.primary} 
            />
            {screenWidth >= MEDIUM_SCREEN_BREAKPOINT && (
              <Text style={styles.addButtonText}>Add Documents</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {content}
    </View>
  )
}
