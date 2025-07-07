import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { useTheme, Text, Button } from '@team556/ui';
import { useDocumentStore } from '@/store/documentStore';
import { useAuthStore } from '@/store/authStore';
import { Document } from '@team556/ui';

interface DocumentDetailsDrawerContentProps {
  document: Document;
  closeDrawer: () => void;
  openDrawer: (drawerName: string, props?: any) => void;
}

const { width } = Dimensions.get('window');

const DocumentDetailsDrawerContent: React.FC<DocumentDetailsDrawerContentProps> = ({ document, closeDrawer, openDrawer }) => {
  const { colors } = useTheme();
  const { deleteDocument } = useDocumentStore();
  const { token } = useAuthStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    scrollContainer: {
      paddingBottom: 100,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.text,
    },
    imageContainer: {
      marginBottom: 20,
    },
    image: {
      width: width - 40,
      height: (width - 40) * 0.75,
      borderRadius: 12,
      marginBottom: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundLight,
    },
    label: {
      fontWeight: 'bold',
      color: colors.text,
    },
    value: {
      color: colors.text,
    },
    notesContainer: {
      marginTop: 20,
    },
    notes: {
      color: colors.text,
      lineHeight: 20,
    },
    buttonContainer: {
      marginTop: 30,
    },
    button: {
      marginBottom: 10,
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          if (!token) {
            Alert.alert('Error', 'Authentication token not found.');
            return;
          }
          await deleteDocument(document.id, token);
          closeDrawer();
        } },
      ]
    );
  };

  const handleEdit = () => {
    openDrawer('AddDocument', { document, isEditMode: true });
  };

  if (!document) {
    return (
      <View style={styles.container}>
        <Text>Document not found.</Text>
      </View>
    );
  }

  const attachments = document.attachments ? JSON.parse(document.attachments) : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{document.name}</Text>

        {attachments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
            {attachments.map((uri: string, index: number) => (
              <Image key={index} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{document.type}</Text>
        </View>
        {document.issuing_authority && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Issuing Authority</Text>
            <Text style={styles.value}>{document.issuing_authority}</Text>
          </View>
        )}
        {document.issue_date && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{new Date(document.issue_date).toLocaleDateString()}</Text>
          </View>
        )}
        {document.expiration_date && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Expiration Date</Text>
            <Text style={styles.value}>{new Date(document.expiration_date).toLocaleDateString()}</Text>
          </View>
        )}
        {document.document_number && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Document Number</Text>
            <Text style={styles.value}>{document.document_number}</Text>
          </View>
        )}

        {document.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notes}>{document.notes}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={handleEdit} style={styles.button} />
          <Button title="Delete" onPress={handleDelete} style={styles.button} variant='danger' />
        </View>
      </ScrollView>
    </View>
  );
};

export default DocumentDetailsDrawerContent;
