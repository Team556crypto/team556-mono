import React from 'react'
import { View, Image, StyleSheet, Dimensions } from 'react-native'
import { useTheme } from './ThemeContext'
import Text from './Text'
import { Firearm } from './types'

interface FirearmCardProps {
  firearm: Firearm
  onPress?: (id: number) => void
}

const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.4
const CARD_HEIGHT = CARD_WIDTH * 1.2

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
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 10,
      justifyContent: 'space-between'
    },
    imageContainer: {
      height: '60%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      overflow: 'hidden',
      borderRadius: 5
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain'
    },
    placeholder: {
      width: '80%',
      height: '80%',
      backgroundColor: colors.backgroundSubtle,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center'
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'flex-start'
    },
    name: {
      fontWeight: 'bold',
      fontSize: 15,
      marginBottom: 4,
      color: colors.text
    },
    details: {
      fontSize: 12,
      color: colors.textSecondary
    }
  })

  const renderImage = () => {
    if (firearm.image_raw) {
      return <Image source={{ uri: firearm.image_raw }} style={styles.image} />
    } else {
      return (
        <View style={styles.placeholder}>
          <Text style={{ color: colors.textTertiary }}>{/* No Image */}</Text>
        </View>
      )
    }
  }

  return (
    <View style={styles.card} onTouchEnd={handlePress}>
      <View style={styles.imageContainer}>{renderImage()}</View>
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode='tail'>
          {firearm.name}
        </Text>
        <Text style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
          {firearm.type} - {firearm.caliber}
        </Text>
      </View>
    </View>
  )
}
