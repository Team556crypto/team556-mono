import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import Text from './Text';
import { NFA } from './types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from './constants';

interface NFACardProps {
  nfa: NFA;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function NFACard({ nfa, onPress, onDelete, width = DEFAULT_CARD_WIDTH, height = DEFAULT_CARD_HEIGHT }: NFACardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(nfa.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(nfa.id);
    }
  };

  const styles = StyleSheet.create({
    card: {
      width,
      height,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.backgroundLight,
    },
    cardGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'flex-start',
    },
    imageContainer: {
      width: '100%',
      height: '65%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
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
      borderColor: colors.backgroundLight,
    },
    categoryText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1,
    },
    name: {
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 6,
      color: colors.text,
    },
    details: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });

  const getNFAIcon = () => {
    const type = nfa.type?.toLowerCase() || '';
    if (type.includes('suppressor')) {
      return 'volume-off';
    } else if (type.includes('sbr') || type.includes('sbs')) {
      return 'rocket-launch-outline';
    } else if (type.includes('machine_gun')) {
      return 'pistol';
    }
    return 'shield-lock-outline';
  };

  const renderImage = () => {
    if (nfa.picture) {
      return (
        <>
          <Image source={{ uri: nfa.picture }} style={styles.image} contentFit='cover' />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{nfa.type || 'NFA'}</Text>
          </View>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={getNFAIcon()} size={36} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{nfa.type || 'NFA'}</Text>
          </View>
        </>
      );
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [{ width: '100%', height: '100%' }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        onPress={handlePress}
      >
        <LinearGradient colors={[colors.backgroundCard, colors.backgroundDark]} style={styles.cardGradient}>
          <View style={styles.imageContainer}>{renderImage()}</View>
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
              {nfa.manufacturer} {nfa.model_name}
            </Text>
            <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
              {nfa.caliber || ''}
            </Text>
            <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
              {nfa.tax_stamp_type || ''}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
      {onDelete && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}
