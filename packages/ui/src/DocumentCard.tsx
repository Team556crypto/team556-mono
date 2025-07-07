import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { useTheme } from './ThemeContext';
import { Document } from './types';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from './constants';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function DocumentCard({ document, onPress, onDelete, width = DEFAULT_CARD_WIDTH, height = DEFAULT_CARD_HEIGHT }: DocumentCardProps) {
  const { colors } = useTheme();

  const displayDate = document.expiry_date
    ? `Expires: ${new Date(document.expiry_date).toLocaleDateString()}`
    : document.issue_date
      ? `Issued: ${new Date(document.issue_date).toLocaleDateString()}`
      : '';

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
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundCard,
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

  return (
    <View style={styles.card}>
      {onDelete && (
        <Pressable style={styles.deleteButton} onPress={() => onDelete(document.id)}>
          <Ionicons name="trash-outline" size={20} color="white" />
        </Pressable>
      )}
      <TouchableOpacity onPress={onPress} style={styles.touchable} activeOpacity={0.8}>
        <View style={styles.placeholder}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
        </View>
        <View style={styles.overlay} />
        <View style={styles.textContainer}>
          <Text style={styles.nameText} preset="h4">{document.name}</Text>
          <Text style={styles.detailText}>{document.type}</Text>
          {displayDate ? <Text style={styles.detailText}>{displayDate}</Text> : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};
