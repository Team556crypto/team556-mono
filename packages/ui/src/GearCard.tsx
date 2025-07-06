import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { useTheme } from './ThemeContext';
import { Gear } from './types';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from './constants';

interface GearCardProps {
  gear: Gear;
  onPress: () => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function GearCard({ gear, onPress, onDelete, width = DEFAULT_CARD_WIDTH, height = DEFAULT_CARD_HEIGHT }: GearCardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      width: width,
      height: height,
      borderRadius: 12,
      backgroundColor: colors.background,
      ...Platform.select({
        ios: {
          shadowColor: 'rgba(0,0,0,0.4)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        },
        android: {
          elevation: 8,
        },
      }),
      overflow: 'hidden',
    },
    touchable: {
      flex: 1,
    },
    imageBackground: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    textContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      padding: 12,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundCard,
    },
    nameText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 18,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    detailText: {
      color: 'white',
      fontSize: 14,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 1,
    },
  });

  const getDisplayContent = () => {
    if (gear.pictures) {
      try {
        const pictures = JSON.parse(gear.pictures);
        if (Array.isArray(pictures) && pictures.length > 0) {
          return <Image source={{ uri: pictures[0] }} style={styles.imageBackground} contentFit="cover" />;
        }
      } catch (e) {
        console.error("Error parsing gear pictures", e);
      }
    }
    return (
      <View style={[styles.imageBackground, styles.placeholder]}>
        <MaterialCommunityIcons name="cog" size={48} color={colors.textTertiary} />
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {onDelete && (
        <Pressable style={styles.deleteButton} onPress={() => onDelete(gear.id)}>
          <Ionicons name="trash-outline" size={20} color="white" />
        </Pressable>
      )}
      <TouchableOpacity onPress={onPress} style={styles.touchable} activeOpacity={0.8}>
        {getDisplayContent()}
        <View style={styles.overlay} />
        <View style={styles.textContainer}>
          <Text style={styles.nameText} preset="h4">{gear.name}</Text>
          <Text style={styles.detailText}>{gear.type}</Text>
          <Text style={styles.detailText}>{`Qty: ${String(gear.quantity)}`}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};


