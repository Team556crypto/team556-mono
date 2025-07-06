import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from './ThemeContext'
import Text from './Text'
import { Ammo } from './types'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from './constants';

interface AmmoCardProps {
  ammo: Ammo;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function AmmoCard({
  ammo,
  onPress,
  onDelete,
  width = DEFAULT_CARD_WIDTH,
  height = DEFAULT_CARD_HEIGHT
}: AmmoCardProps) {
  const { colors } = useTheme()
  const handlePress = () => {
    if (onPress) {
      onPress(ammo.id)
    }
  }

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
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingHorizontal: 12
    },
    name: {
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 6,
      color: colors.text
    },
    details: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500'
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
    }
  })

  const renderImage = () => {
    let firstImageUri: string | undefined;
    if (ammo.pictures) {
      try {
        const parsedPictures = JSON.parse(ammo.pictures);
        if (Array.isArray(parsedPictures) && parsedPictures.length > 0) {
          firstImageUri = parsedPictures[0];
        }
      } catch (e) {
        console.error("Failed to parse ammo pictures JSON:", e);
      }
    }

    if (firstImageUri) {
      return (
        <>
          <Image source={{ uri: firstImageUri }} style={styles.image} contentFit='cover' />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{ammo.type || 'Ammo'}</Text>
          </View>
        </>
      )
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="ammunition" size={48} color={colors.textTertiary} />
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{ammo.type || 'Ammo'}</Text>
          </View>
        </>
      )
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      onPress={handlePress}
    >
      <LinearGradient colors={[colors.backgroundCard, colors.backgroundDark]} style={styles.cardGradient}>
        <View style={styles.imageContainer}>{renderImage()}</View>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
            {`${ammo.manufacturer} ${ammo.caliber}`}
          </Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
            {`${ammo.grainWeight}gr ${ammo.type}`}
          </Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
            {`Qty: ${ammo.quantity}`}
          </Text>
        </View>
        {onDelete && (
          <Pressable style={styles.deleteButton} onPress={() => onDelete(ammo.id)}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </LinearGradient>
    </Pressable>
  )
}
