import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, ActionSheetIOS, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, Text, Input, Button } from '@team556/ui';
import { useGearStore } from '@/store/gearStore';
import { useAuthStore } from '@/store/authStore';
import { CreateGearPayload } from '@team556/ui';

interface AddGearDrawerContentProps {
  closeDrawer: () => void;
}

const AddGearDrawerContent: React.FC<AddGearDrawerContentProps> = ({ closeDrawer }) => {
  const { colors } = useTheme();
  const { addGear, isLoading } = useGearStore();
  const { token } = useAuthStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [pictures, setPictures] = useState<string[]>([]);

  const handleAddPicture = async () => {
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
          setPictures(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
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
          setPictures(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
        }
      };
  
      if (Platform.OS === 'ios') {
        showActionSheet();
      } else {
        Alert.alert(
          'Add Photo',
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
    if (!name || !type || !quantity) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    const payload: CreateGearPayload = {
      name,
      type,
      manufacturer: manufacturer || undefined,
      model: model || undefined,
      quantity: parseInt(quantity, 10),
      purchaseDate: purchaseDate?.toISOString(),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      notes: notes || undefined,
      pictures: pictures.length > 0 ? JSON.stringify(pictures) : undefined,
    };

    const success = await addGear(payload, token);
    if (success) {
      closeDrawer();
    }
  }, [name, type, manufacturer, model, quantity, purchaseDate, purchasePrice, notes, pictures, addGear, token, closeDrawer]);

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
        <Text style={styles.title}>Add New Gear</Text>
        <Input
          style={styles.input}
          label="Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Plate Carrier"
        />
        <Input
          style={styles.input}
          label="Type *"
          value={type}
          onChangeText={setType}
          placeholder="e.g., Combat, Hunting, Camping"
        />
        <Input
          style={styles.input}
          label="Manufacturer"
          value={manufacturer}
          onChangeText={setManufacturer}
          placeholder="e.g., Crye Precision"
        />
        <Input
          style={styles.input}
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder="e.g., JPC 2.0"
        />
        <Input
          style={styles.input}
          label="Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <Input
          style={styles.input}
          label="Purchase Price"
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
          placeholder="e.g., 250.00"
        />
        <Input
          style={styles.input}
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="e.g., Size, color, modifications"
        />
        <Button title="Add Picture" onPress={handleAddPicture} style={styles.button} />
        <View style={styles.imagePreviewContainer}>
          {pictures.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>
        <Button
          title="Add Gear"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

export default AddGearDrawerContent;
