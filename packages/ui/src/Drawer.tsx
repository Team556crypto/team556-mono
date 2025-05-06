import React, { useEffect, useCallback, Fragment, useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  Text
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { DefaultColors, ThemeColors } from '../constants/Colors'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

// Maximum height the drawer can take (95% of screen height)
const MAX_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.95
// Minimum height for the drawer
const MIN_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.2

// Constants for layout calculations
const HANDLE_HEIGHT = 30
const CONTENT_PADDING = 40
const SHADOW_OFFSET = 10

export type DrawerSize = 'auto' | number

interface DrawerProps {
  children: React.ReactNode
  isVisible: boolean
  onClose: () => void
  maxHeight?: number | string
  minHeight?: number | string
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
  handleBarStyle?: StyleProp<ViewStyle>
  backdropOpacity?: number
  colors?: Partial<ThemeColors>
  title?: string
}

export default function Drawer({
  children,
  isVisible,
  onClose,
  maxHeight = MAX_DRAWER_HEIGHT,
  minHeight = MIN_DRAWER_HEIGHT,
  style,
  containerStyle,
  handleBarStyle,
  backdropOpacity = 0.5,
  colors = {},
  title
}: DrawerProps): JSX.Element {
  // Merge provided colors with defaults
  const themeColors = { ...DefaultColors, ...colors }

  const [contentHeight, setContentHeight] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(isVisible)
  const isInitialRender = useRef(true)

  // Function to parse height values that can be numbers or percentage strings
  const parseHeightValue = (value: number | string | undefined, defaultValue: number): number => {
    if (value === undefined) return defaultValue;
    
    if (typeof value === 'number') return value;
    
    // Handle percentage string
    if (typeof value === 'string' && value.endsWith('%')) {
      const percentage = parseFloat(value) / 100;
      return SCREEN_HEIGHT * percentage;
    }
    
    // Try to parse as a number
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Calculate drawer height based on content with min/max constraints
  // Add padding, handle height, and a bit extra for shadow/spacing
  const totalPadding = HANDLE_HEIGHT + CONTENT_PADDING + SHADOW_OFFSET
  const calculatedHeight = contentHeight > 0 ? contentHeight + totalPadding : parseHeightValue(minHeight, MIN_DRAWER_HEIGHT)
  const maxHeightValue = parseHeightValue(maxHeight, MAX_DRAWER_HEIGHT)
  const minHeightValue = parseHeightValue(minHeight, MIN_DRAWER_HEIGHT)
  const drawerHeight = Math.min(maxHeightValue, Math.max(minHeightValue, calculatedHeight))

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const context = useSharedValue({ y: 0 })
  const backdropOpacityAnimated = useSharedValue(0)

  // Use useAnimatedReaction to safely check shared value changes
  useAnimatedReaction(
    () => {
      return {
        isVisible,
        translateYValue: translateY.value
      }
    },
    (result, previous) => {
      if (!result.isVisible && result.translateYValue === SCREEN_HEIGHT) {
        // Only run this when the values actually change to avoid unnecessary renders
        if (
          !previous ||
          previous.isVisible !== result.isVisible ||
          previous.translateYValue !== result.translateYValue
        ) {
          runOnJS(setShouldRender)(false)
        }
      } else if (!shouldRender) {
        runOnJS(setShouldRender)(true)
      }
    }
  )

  const runOnJSClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout

      // Always update height on layout change
      setContentHeight(height)

      // If this is our first time showing the drawer and we're still waiting for a measurement,
      // trigger animation after we know the content size
      if (isVisible && isInitialRender.current && !isAnimating) {
        isInitialRender.current = false

        // Small delay to ensure layout calculations are complete
        setTimeout(() => {
          translateY.value = withSpring(0, {
            damping: 22,
            stiffness: 180,
            mass: 0.8,
            velocity: 20
          })
          backdropOpacityAnimated.value = withTiming(backdropOpacity, { duration: 150 })
          setIsAnimating(true)
        }, 10)
      }
    },
    [isVisible, isAnimating, backdropOpacity, translateY, backdropOpacityAnimated]
  )

  useEffect(() => {
    if (isVisible) {
      // --- Scroll Lock for Web ---
      if (Platform.OS === 'web') {
        document.body.style.overflow = 'hidden'
      }
      // --- End Scroll Lock ---

      setShouldRender(true)

      // Only animate immediately if we already have a content height
      if (contentHeight > 0) {
        translateY.value = withSpring(0, {
          damping: 22,
          stiffness: 180,
          mass: 0.8,
          velocity: 20
        })
        backdropOpacityAnimated.value = withTiming(backdropOpacity, { duration: 150 })
        setIsAnimating(true)
      }
      // Otherwise wait for onLayout to get content height first

      // Show backdrop immediately
      backdropOpacityAnimated.value = withTiming(backdropOpacity, { duration: 150 })
    } else {
      // --- Scroll Unlock for Web ---
      if (Platform.OS === 'web') {
        document.body.style.overflow = 'auto' // Unlock immediately
      }
      // --- End Scroll Unlock ---

      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 100
      })
      backdropOpacityAnimated.value = withTiming(0, { duration: 150 })
      setIsAnimating(false)
      isInitialRender.current = true
    }
  }, [isVisible, translateY, backdropOpacityAnimated, backdropOpacity, contentHeight])

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value }
    })
    .onUpdate(event => {
      // Only allow dragging down (positive delta)
      if (event.translationY < 0) {
        translateY.value = Math.max(0, context.value.y + event.translationY / 2)
      } else {
        translateY.value = context.value.y + event.translationY
      }
    })
    .onEnd(event => {
      // If dragged down with significant velocity or distance, close drawer
      if (event.velocityY > 500 || translateY.value > drawerHeight * 0.4) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 15,
          stiffness: 90
        })
        backdropOpacityAnimated.value = withTiming(0, { duration: 200 })
        runOnJS(runOnJSClose)()
      } else {
        // Otherwise spring back to open position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90
        })
      }
    })

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacityAnimated.value
    }
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }]
    }
  })

  if (!shouldRender) {
    return <Fragment />
  }

  // Define content for better type safety
  const drawerContent = <Fragment>{children}</Fragment>

  return (
    <View style={styles.rootContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
      </TouchableWithoutFeedback>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.drawer,
            {
              height: drawerHeight,
              backgroundColor: themeColors.backgroundDark
            },
            style,
            animatedStyle
          ]}
        >
          <View style={styles.handleBarContainer}>
            <View style={[styles.handleBar, handleBarStyle]} />
          </View>
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          <View style={[styles.contentContainer, containerStyle]} onLayout={handleContentLayout}>
            <ScrollView>{drawerContent}</ScrollView>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999999,
    elevation: 999999,
    pointerEvents: 'box-none'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    zIndex: 999999,
    elevation: 999999
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 999999,
    elevation: 999999,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  handleBarContainer: {
    width: '100%',
    height: HANDLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  contentContainer: {
    padding: 20
  },
  titleContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  }
})
