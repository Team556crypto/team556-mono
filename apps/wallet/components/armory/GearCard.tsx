import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@team556/ui/src/ThemeContext';
import Text from '@team556/ui/src/Text';
import { Gear } from '@team556/ui/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from '@team556/ui/src/constants';

interface GearCardProps {
  gear: Gear;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function GearCard({
  gear,
  onPress,
  onDelete,
  width = DEFAULT_CARD_WIDTH,
  height = DEFAULT_CARD_HEIGHT
}: GearCardProps) {
  const { colors } = useTheme();
  const handlePress = () => {
    if (onPress) {
      onPress(gear.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(gear.id);
    }
  };

  const getIconForGearType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'optic':
        return 'telescope';
      case 'armor':
        return 'shield-half-full';
      case 'helmet':
        return 'hard-hat';
      case 'holster':
        return 'pistol';
      case 'pouch':
        return 'briefcase-outline';
      default:
        return 'tools';
    }
  };

  const pictures = gear.pictures ? JSON.parse(gear.pictures) : [];
  const imageUrl = pictures.length > 0 ? pictures[0] : null;

  const styles = StyleSheet.create({
    card: {
      width,
      height,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.backgroundLight
    },
    cardGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'flex-start'
    },
    imageContainer: {
      width: '100%',
      height: '65%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    },
    logoOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    categoryTag: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.backgroundDarker,
      borderWidth: 1,
      borderColor: colors.backgroundLight
    },
    categoryText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500'
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
    },
    placeholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textSecondary
    },
    infoContainer: {
      padding: 12,
      flex: 1,
      justifyContent: 'space-between'
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundDarker,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8
    },
    quantityText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      marginLeft: 4
    },
    deleteButton: {
      padding: 4
    }
  });

  return (
    <Pressable onPress={handlePress}>
      <View style={styles.card}>
        <LinearGradient colors={[colors.background, colors.backgroundDarker]} style={styles.cardGradient}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name={getIconForGearType(gear.type)} size={64} color={colors.backgroundLight} />
              </View>
            )}
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{gear.type}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <View>
              <Text style={styles.title} numberOfLines={1}>{gear.name}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{gear.manufacturer || ''} {gear.model || ''}</Text>
            </View> 
            <View style={styles.footer}>
              <View style={styles.quantityContainer}>
                <MaterialCommunityIcons name="archive-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.quantityText}>{gear.quantity.toString()}</Text>
              </View>
              {onDelete && (
                <Pressable onPress={handleDelete} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                </Pressable>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
