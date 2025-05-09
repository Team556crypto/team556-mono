import React, { useState, useCallback } from 'react'
import { ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Badge } from './Badge'

export interface HorizontalBadgeScrollProps {
  items: string[]
  initialSelectedItem?: string
  onSelect?: (item: string) => void
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
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
    (item: string) => {
      setSelectedItem(item)
      if (onSelect) {
        onSelect(item)
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
        <Badge key={item} label={item} isActive={selectedItem === item} onPress={() => handlePress(item)} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0 // Prevent ScrollView from taking full height
  }
})
