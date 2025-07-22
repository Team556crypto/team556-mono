import React, { useState, useCallback } from 'react'
import { ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Badge } from './Badge'

export interface BadgeItem {
  label: string;
  icon?: React.ReactNode;
}

export interface HorizontalBadgeScrollProps {
  items: BadgeItem[];
  initialSelectedItem?: string;
  onSelect?: (item: string) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const HorizontalBadgeScroll = ({
  items,
  initialSelectedItem,
  onSelect,
  style,
  contentContainerStyle
}: HorizontalBadgeScrollProps) => {
  const [selectedItem, setSelectedItem] = useState<string | undefined>(initialSelectedItem)

  const handlePress = useCallback(
    (item: BadgeItem) => {
      setSelectedItem(item.label);
      if (onSelect) {
        onSelect(item.label);
      }
    },
    [onSelect]
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollView, style]}
      contentContainerStyle={contentContainerStyle}
    >
      {items.map(item => (
        <Badge
          key={item.label}
          label={item.label}
          icon={item.icon}
          isActive={selectedItem === item.label}
          onPress={() => handlePress(item)}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0 // Prevent ScrollView from taking full height
  }
})
