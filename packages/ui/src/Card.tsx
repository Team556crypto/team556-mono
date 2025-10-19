import React from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import Text from './Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from './constants';

interface CardProps {
  onPress?: () => void;
  onDelete?: () => void;
  width?: number;
  height?: number;
  imageUri?: string;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  category?: string;
  title: string;
  details: (string | null | undefined)[];
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Card({
  onPress,
  onDelete,
  width = DEFAULT_CARD_WIDTH,
  height = DEFAULT_CARD_HEIGHT,
  imageUri,
  iconName = 'crosshairs-gps',
  category,
  title,
  details,
  containerStyle
}: CardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      width,
      height,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.backgroundLight,
      position: 'relative'
    },
    cardContent: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      overflow: 'hidden'
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
    categoryTag: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.backgroundLight
    },
    categoryText: {
      fontSize: 12,
      color: colors.text,
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
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'transparent',
      zIndex: 999,
      elevation: 5,
    },
  });

  const renderImage = () => {
    if (imageUri) {
      return (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit='cover' />
          {category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
        </>
      );
    } else {
      return (
        <>
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={iconName} size={36} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
          {category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
        </>
      );
    }
  };

  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.cardContent}>
        <Pressable
          style={({ pressed }) => [{ width: '100%', height: '100%' }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={onPress}
          disabled={false}
        >
          <LinearGradient colors={[colors.backgroundCard, colors.backgroundDark]} style={styles.cardGradient}>
            <View style={styles.imageContainer}>{renderImage()}</View>
            <View style={styles.infoContainer}>
              <Text style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
                {title}
              </Text>
              {details
                .filter((d): d is string => !!d)
                .map((detail, index) => (
                  <Text key={index} style={styles.details} numberOfLines={1} ellipsizeMode='tail'>
                    {detail}
                  </Text>
                ))}
            </View>
          </LinearGradient>
        </Pressable>
      </View>
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            console.log('DELETE BUTTON CLICKED!');
            e?.stopPropagation?.();
            onDelete();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}
