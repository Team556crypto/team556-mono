import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native'
import { Text } from '@repo/ui' // Assuming Text comes from shared UI
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface ScreenLayoutProps {
  children: React.ReactNode
  title: string
  /** Optional icon to display before the title */
  headerIcon?: React.ReactNode
  /** Optional color for the title text */
  titleColor?: string
  /** Optional element to display on the right side of the header */
  headerRightElement?: React.ReactNode
  /** Optional styles for the ScrollView content container */
  contentContainerStyle?: ViewStyle
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  title,
  headerIcon,
  titleColor,
  headerRightElement,
  contentContainerStyle
}) => {
  const { isTabletOrLarger } = useBreakpoint()

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[styles.container, isTabletOrLarger && styles.containerTablet]}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            {headerIcon && <View style={styles.iconContainer}>{headerIcon}</View>}
            <Text preset='h3' color={titleColor}>
              {title}
            </Text>
          </View>
          {headerRightElement}
        </View>

        {/* Screen Content */}
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDarker // Use the darkest background from index.tsx
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  containerTablet: {
    marginLeft: 240, // Standard sidebar width adjustment for tablet
    paddingTop: 24,
    paddingRight: 32 // Different padding for tablet
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center'
  }
})
