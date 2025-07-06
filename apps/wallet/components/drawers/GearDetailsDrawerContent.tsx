import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { useTheme, Text, Button } from '@team556/ui';
import { useGearStore } from '@/store/gearStore';

interface GearDetailsDrawerContentProps {
  gearId: number;
  closeDrawer: () => void;
  openDrawer: (drawerName: string, props?: any) => void;
}

const { width } = Dimensions.get('window');

const GearDetailsDrawerContent: React.FC<GearDetailsDrawerContentProps> = ({ gearId, closeDrawer, openDrawer }) => {
  const { colors } = useTheme();
  const { getGearById, removeGear } = useGearStore();
  const gear = getGearById(gearId);

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
      'Delete Gear',
      'Are you sure you want to delete this gear item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          removeGear(gearId);
          closeDrawer();
        }},
      ]
    );
  };

  const handleEdit = () => {
    openDrawer('AddGear', { gear, isEditMode: true });
  };

  if (!gear) {
    return (
      <View style={styles.container}>
        <Text>Gear not found.</Text>
      </View>
    );
  }

  const pictures = gear.pictures ? JSON.parse(gear.pictures) : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{gear.name}</Text>

        {pictures.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
            {pictures.map((uri: string, index: number) => (
              <Image key={index} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{gear.type}</Text>
        </View>
        {gear.manufacturer && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Manufacturer</Text>
            <Text style={styles.value}>{gear.manufacturer}</Text>
          </View>
        )}
        {gear.model && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Model</Text>
            <Text style={styles.value}>{gear.model}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.value}>{String(gear.quantity)}</Text>
        </View>
        {gear.purchaseDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Purchase Date</Text>
            <Text style={styles.value}>{new Date(gear.purchaseDate).toLocaleDateString()}</Text>
          </View>
        )}
        {gear.purchasePrice && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Purchase Price</Text>
            <Text style={styles.value}>${gear.purchasePrice.toFixed(2)}</Text>
          </View>
        )}

        {gear.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notes}>{gear.notes}</Text>
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

export default GearDetailsDrawerContent;
