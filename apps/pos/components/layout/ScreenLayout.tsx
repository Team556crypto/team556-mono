import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, View, type ViewStyle, Platform } from 'react-native'
import { Text } from '@team556/ui' // Assuming Text comes from shared UI
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
  /** Determines if the content should be scrollable. Defaults to true. */
  scrollEnabled?: boolean
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  title,
  headerIcon,
  titleColor,
  headerRightElement,
  contentContainerStyle,
  scrollEnabled = true
}) => {
  const { isTabletOrLarger } = useBreakpoint()

  const Header = (
    <View style={[styles.headerRow, Platform.OS === 'android' && { paddingTop: 50 }]}>
      <View style={styles.titleContainer}>
        {headerIcon && <View style={styles.iconContainer}>{headerIcon}</View>}
        <Text preset='h4' color={titleColor}>
          {title}
        </Text>
      </View>
      {headerRightElement}
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {scrollEnabled ? (
        <ScrollView
          style={[styles.container, isTabletOrLarger && styles.containerTablet]}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          {Header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, isTabletOrLarger && styles.containerTablet]}>
          {Header}
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      )}
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
    paddingTop: Platform.OS === 'android' ? 6 : 16,
    // marginBottom: 20
  },
  containerTablet: {
    marginLeft: 240, // Standard sidebar width adjustment for tablet
    paddingTop: 32,
    paddingRight: 32 // Different padding for tablet,
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
