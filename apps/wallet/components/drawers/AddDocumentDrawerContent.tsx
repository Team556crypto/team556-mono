import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, ActionSheetIOS, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, Text, Input, Button, Select } from '@team556/ui';
import { useDocumentStore } from '@/store/documentStore';
import { useAuthStore } from '@/store/authStore';
import { CreateDocumentPayload, documentTypeOptions } from '@team556/ui';

interface AddDocumentDrawerContentProps {
  closeDrawer: () => void;
}

const AddDocumentDrawerContent: React.FC<AddDocumentDrawerContentProps> = ({ closeDrawer }) => {
  const { colors } = useTheme();
  const { addDocument, isLoading } = useDocumentStore();
  const { token } = useAuthStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleAddAttachment = async () => {
    const showActionSheet = () => {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Library'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              await takePhoto();
            } else if (buttonIndex === 2) {
              await chooseFromLibrary();
            }
          }
        );
      };
  
      const takePhoto = async () => {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets[0].base64) {
          setAttachments(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
        }
      };
  
      const chooseFromLibrary = async () => {
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaLibraryPermission.granted) {
          Alert.alert('Permission needed', 'Media library permission is required to choose photos.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets[0].base64) {
          setAttachments(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
        }
      };
  
      if (Platform.OS === 'ios') {
        showActionSheet();
      } else {
        Alert.alert(
          'Add Attachment',
          'Choose an option',
          [
            { text: 'Take Photo', onPress: takePhoto },
            { text: 'Choose from Library', onPress: chooseFromLibrary },
            { text: 'Cancel', style: 'cancel' },
          ],
          { cancelable: true }
        );
      }
  }

  const handleSubmit = useCallback(async () => {
    if (!name || !type) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    const payload: CreateDocumentPayload = {
      name,
      type,
      issuing_authority: issuingAuthority || undefined,
      issue_date: issueDate?.toISOString(),
      expiration_date: expirationDate?.toISOString(),
      document_number: documentNumber || undefined,
      notes: notes || undefined,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
    };

    const success = await addDocument(payload, token);
    if (success) {
      closeDrawer();
    }
  }, [name, type, issuingAuthority, issueDate, expirationDate, documentNumber, notes, attachments, addDocument, token, closeDrawer]);

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
    input: {
        marginBottom: 15,
    },
    label: {
        color: colors.text,
        marginBottom: 8,
        fontWeight: '500',
    },
    button: {
        marginTop: 10,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 8,
        margin: 5,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Document</Text>
        <View style={styles.input}>
          <Text style={styles.label}>Name *</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g., Concealed Carry Permit"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>Type *</Text>
          <Select
            selectedValue={type}
            onValueChange={(itemValue) => setType(String(itemValue))}
            items={documentTypeOptions}
            placeholder="Select a document type"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>Issuing Authority</Text>
          <Input
            value={issuingAuthority}
            onChangeText={setIssuingAuthority}
            placeholder="e.g., State Police"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>Document Number</Text>
          <Input
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="e.g., 123456789"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>Notes</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="e.g., Restrictions, endorsements"
          />
        </View>
        <Button title="Add Attachment" onPress={handleAddAttachment} style={styles.button} />
        <View style={styles.imagePreviewContainer}>
          {attachments.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>
        <Button
          title="Add Document"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

export default AddDocumentDrawerContent;
