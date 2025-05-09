import React from 'react'
import { View, StyleSheet, Dimensions, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from './ThemeContext'
import Text from './Text'
import { Firearm } from './types'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'

interface FirearmCardProps {
  firearm: Firearm
  onPress?: (id: number) => void
}

const { width } = Dimensions.get('window')
export const CARD_WIDTH = width * 0.42
export const CARD_HEIGHT = CARD_WIDTH * 1.4

export default function FirearmCard({ firearm, onPress }: FirearmCardProps) {
  const { colors } = useTheme()
  const handlePress = () => {
    if (onPress) {
      onPress(firearm.id)
    }
  }

  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.backgroundSubtle
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
      borderTopRightRadius: 18,
      borderTopLeftRadius: 18,
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
      borderColor: colors.backgroundCard
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
      color: colors.textTertiary,
      fontWeight: '500'
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
    }
  })

  const getFirearmIcon = () => {
    const type = firearm.type?.toLowerCase() || ''
    if (type.includes('pistol') || type.includes('handgun')) {
      return 'target'
    } else if (type.includes('rifle') || type.includes('shotgun')) {
      return 'crosshairs'
    } else if (type.includes('nfa')) {
      return 'shield'
    }
    return 'crosshairs-gps'
  }

  const renderImage = () => {
    if (firearm.image) {
      const imageUri = firearm.image

      return (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit='cover' />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'Firearm'}</Text>
          </View>
        </>
      )
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={getFirearmIcon()} size={36} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{firearm.type || 'Firearm'}</Text>
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
            {firearm.name}
          </Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
            {firearm.manufacturer ? `${firearm.manufacturer} ` : ''}
            {firearm.model_name || ''}
          </Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
            {firearm.caliber || ''}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  )
}
