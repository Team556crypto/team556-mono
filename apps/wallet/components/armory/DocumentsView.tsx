import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  useWindowDimensions,
  Alert
} from 'react-native'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { DocumentCard, Text, Button, EmptyState, DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui'
import { useTheme } from '@team556/ui'
import { Document } from '@/services/api'
import { useDrawerStore } from '@/store/drawerStore'
import DocumentDetailsDrawerContent from '@/components/drawers/DocumentDetailsDrawerContent'
import AddDocumentDrawerContent from '@/components/drawers/AddDocumentDrawerContent'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

// Responsive layout constants
const SMALL_SCREEN_BREAKPOINT = 576;
const MEDIUM_SCREEN_BREAKPOINT = 768;
const LARGE_SCREEN_BREAKPOINT = 992;
const XLARGE_SCREEN_BREAKPOINT = 1200;

// Grid layout constants
const PADDING = 16;
const COLUMN_GAP = 16;

export const DocumentsView = () => {
  const { colors } = useTheme();
  const token = useAuthStore(state => state.token);
  const canAddItem = useAuthStore(state => state.canAddItem('document'));
  const { width: screenWidth } = useWindowDimensions();

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

  const [dimensions, setDimensions] = useState(getResponsiveLayout());

  useFocusEffect(
    useCallback(() => {
      setDimensions(getResponsiveLayout());
    }, [screenWidth])
  );

  const { documents, isLoading, error, fetchInitialDocuments, deleteDocument, hasAttemptedInitialFetch, setError } = useDocumentStore();
  const { openDrawer, closeDrawer } = useDrawerStore();
  const validDocuments = Array.isArray(documents) ? documents.filter(item => item && item.id) : [];

  useEffect(() => {
    if (token && !hasAttemptedInitialFetch && !isLoading) {
      fetchInitialDocuments(token);
    }
  }, [token, hasAttemptedInitialFetch, isLoading, fetchInitialDocuments]);

  const handleDocumentPress = (doc: Document) => {
    openDrawer(<DocumentDetailsDrawerContent document={doc} closeDrawer={closeDrawer} openDrawer={openDrawer} />, { maxHeight: '90%' });
  };

  const handleAddDocument = () => {
    openDrawer(<AddDocumentDrawerContent closeDrawer={closeDrawer} />);
  };

  const handleDelete = (documentId: number) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDocument(documentId, token);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete document.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false },
    );
  };

  const renderItem = ({ item }: { item: Document }) => (
    <View style={[styles.gridItem, { width: dimensions.cardWidth }]}>
      <DocumentCard
        document={item}
        onPress={() => handleDocumentPress(item)}
        onDelete={() => handleDelete(item.id)}
        width={dimensions.cardWidth}
        height={dimensions.cardHeight}
      />
    </View>
  );

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
  });

  let content;
  if (isLoading && validDocuments.length === 0) {
    content = <View style={styles.centerMessage}><ActivityIndicator size="large" color={colors.primary} /></View>;
  } else if (error) {
    content = (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{error}</Text>
        <Button variant="outline" title="Dismiss" onPress={() => setError(null)} style={{ marginTop: 16 }} />
      </View>
    );
  } else if (validDocuments.length === 0) {
    content = (
      <EmptyState
        icon={<Ionicons name='document-text-outline' size={80} color={colors.primary} />}
        title='No Documents Yet'
        subtitle='Get started by adding your first document to your armory.'
        buttonText='+ Add Document'
        onPress={handleAddDocument}
      />
    );
  } else {
    content = (
      <FlatList
        key={dimensions.numColumns}
        data={validDocuments}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={dimensions.numColumns}
        style={styles.flatListContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={dimensions.numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={isLoading ? <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} /> : null}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name='file-document-multiple' size={24} color={colors.primary} />
          <Text preset='h3'>Documents</Text>
        </View>
        {canAddItem && (
          <TouchableOpacity style={styles.addButtonHeaderSmall} onPress={handleAddDocument}>
            <Ionicons name="add-circle" size={24} color="#805AD5" />
          </TouchableOpacity>
        )}
      </View>
      {content}
      {!canAddItem && (
        <Text style={styles.limitReachedText}>
          You've reached the maximum number of documents in the free plan.
          Upgrade to Premium for unlimited documents.
        </Text>
      )}
    </View>
  )
};
