import React, { useEffect, useCallback, Fragment, useState, useMemo } from 'react'
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
  Text,
  ActivityIndicator
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  useAnimatedReaction,
  WithSpringConfig,
  WithTimingConfig
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { DefaultColors, ThemeColors } from '../constants/Colors'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Maximum height the drawer can take (95% of screen height)
const MAX_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.9
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
  animationConfig?: Partial<WithSpringConfig>
  timingAnimationConfig?: Partial<WithTimingConfig>
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
  title,
  animationConfig = {},
  timingAnimationConfig = {}
}: DrawerProps): JSX.Element | null {
  const themeColors = { ...DefaultColors, ...colors }

  // Memoize the spring configuration to be used for animations
  const memoizedSpringConfig = useMemo((): WithSpringConfig => {
    const { duration, dampingRatio, clamp, ...rest } = animationConfig
    return {
      damping: 18,
      stiffness: 360,
      mass: 0.7,
      velocity: 20,
      ...rest
    }
  }, [animationConfig])

  const [contentHeight, setContentHeight] = useState(0)
  const [isContentLoaded, setIsContentLoaded] = useState(false)
  const [shouldRender, setShouldRender] = useState(isVisible)

  const parseHeightValue = (value: number | string | undefined, defaultValue: number): number => {
    if (value === undefined) return defaultValue
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.endsWith('%')) {
      const percentage = parseFloat(value) / 100
      return SCREEN_HEIGHT * percentage
    }
    const parsed = parseFloat(String(value))
    return isNaN(parsed) ? defaultValue : parsed
  }

  const totalPadding = HANDLE_HEIGHT + CONTENT_PADDING + SHADOW_OFFSET

  const maxHeightValue = parseHeightValue(maxHeight, MAX_DRAWER_HEIGHT)
  const minHeightValue = parseHeightValue(minHeight, MIN_DRAWER_HEIGHT)

  const currentDrawerTargetHeight =
    isContentLoaded && contentHeight > 0
      ? Math.min(maxHeightValue, Math.max(minHeightValue, contentHeight + totalPadding))
      : minHeightValue

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const animatedDrawerHeight = useSharedValue(currentDrawerTargetHeight)
  const context = useSharedValue({ y: 0 })
  const backdropOpacityAnimated = useSharedValue(0)

  const runOnJSClose = useCallback(() => {
    onClose()
  }, [onClose])

  const runOnJSSetIsContentLoaded = useCallback((value: boolean) => {
    setIsContentLoaded(value)
  }, [])

  useAnimatedReaction(
    () => {
      return {
        isVisibleProp: isVisible,
        translateYValue: translateY.value
      }
    },
    (result, previous) => {
      if (!result.isVisibleProp && result.translateYValue === SCREEN_HEIGHT) {
        if (
          !previous ||
          previous.isVisibleProp !== result.isVisibleProp ||
          previous.translateYValue !== result.translateYValue
        ) {
          runOnJS(setShouldRender)(false)
        }
      } else if (result.isVisibleProp && !shouldRender) {
        runOnJS(setShouldRender)(true)
      }
    },
    [isVisible, shouldRender]
  )

  useEffect(() => {
    const targetY = isVisible ? 0 : SCREEN_HEIGHT
    const targetOpacity = isVisible ? backdropOpacity : 0

    // Default Timing Animation Configuration
    const timingConfig: WithTimingConfig = {
      duration: 150,
      ...timingAnimationConfig
    }

    if (isVisible) {
      if (Platform.OS === 'web') {
        document.body.style.overflow = 'hidden'
      }
      setShouldRender(true)
      translateY.value = withSpring(targetY, memoizedSpringConfig, () => {
        runOnJS(runOnJSSetIsContentLoaded)(true)
      })
      backdropOpacityAnimated.value = withTiming(targetOpacity, timingConfig)
      animatedDrawerHeight.value = withSpring(minHeightValue, memoizedSpringConfig)
    } else {
      if (Platform.OS === 'web') {
        document.body.style.overflow = 'auto'
      }
      runOnJS(runOnJSSetIsContentLoaded)(false)
      translateY.value = withSpring(targetY, memoizedSpringConfig, () => {})
      backdropOpacityAnimated.value = withTiming(targetOpacity, timingConfig)
      animatedDrawerHeight.value = withSpring(minHeightValue, memoizedSpringConfig)
    }
  }, [
    isVisible,
    backdropOpacity,
    runOnJSSetIsContentLoaded,
    memoizedSpringConfig,
    timingAnimationConfig,
    minHeightValue,
    animatedDrawerHeight,
    backdropOpacityAnimated,
    translateY
  ])

  useEffect(() => {
    if (isVisible && isContentLoaded && contentHeight > 0) {
      const approxTitleHeight = title ? 18 + 10 : 0

      const scrollViewPaddingTop = styles.scrollContent.paddingTop || 0
      const scrollViewPaddingBottom = styles.scrollContent.paddingBottom || 0
      const scrollViewInternalVerticalPadding =
        (typeof scrollViewPaddingTop === 'number' ? scrollViewPaddingTop : 0) +
        (typeof scrollViewPaddingBottom === 'number' ? scrollViewPaddingBottom : 0)

      const platformSpecificDrawerPaddingBottom = Platform.OS === 'ios' ? 20 : 0

      const calculatedRequiredHeight =
        HANDLE_HEIGHT +
        approxTitleHeight +
        contentHeight +
        scrollViewInternalVerticalPadding +
        platformSpecificDrawerPaddingBottom

      const newTargetHeight = Math.min(maxHeightValue, Math.max(minHeightValue, calculatedRequiredHeight))
      animatedDrawerHeight.value = withSpring(newTargetHeight, memoizedSpringConfig)
    } else if (!isVisible) {
      animatedDrawerHeight.value = withSpring(minHeightValue, memoizedSpringConfig)
    }
  }, [
    isVisible,
    isContentLoaded,
    contentHeight,
    maxHeightValue,
    minHeightValue,
    memoizedSpringConfig,
    animatedDrawerHeight,
    title
  ])

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContentHeight(height)
  }, [])

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value }
    })
    .onUpdate(event => {
      translateY.value = Math.max(0, context.value.y + event.translationY)
    })
    .onEnd(event => {
      const threshold = animatedDrawerHeight.value * 0.3
      if (event.translationY > threshold || event.velocityY > 800) {
        runOnJS(runOnJSClose)()
      } else {
        translateY.value = withSpring(0, memoizedSpringConfig)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedDrawerHeight.value,
      transform: [{ translateY: translateY.value }]
    }
  })

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacityAnimated.value
    }
  })

  if (!shouldRender) {
    return null
  }

  return (
    <Fragment>
      <TouchableWithoutFeedback onPress={runOnJSClose}>
        <Animated.View
          style={[styles.backdrop, { backgroundColor: themeColors.backgroundDarker }, backdropAnimatedStyle]}
        />
      </TouchableWithoutFeedback>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.drawerContainer,
            { backgroundColor: themeColors.background, shadowColor: themeColors.backgroundDarkest },
            containerStyle,
            style,
            animatedStyle
          ]}
        >
          <View style={[styles.handleBarContainer, handleBarStyle]}>
            <View style={[styles.handleBar, { backgroundColor: themeColors.textSecondary }]} />
          </View>
          {title && <Text style={[styles.titleText, { color: themeColors.text }]}>{title}</Text>}
          {isContentLoaded ? (
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
            >
              <View onLayout={handleContentLayout}>
                <Fragment>{children}</Fragment>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </Fragment>
  )
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    shadowOffset: { width: 0, height: -SHADOW_OFFSET / 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 2,
    overflow: 'hidden'
  },
  handleBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    height: HANDLE_HEIGHT
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: Platform.OS === 'android' ? -5 : 0
  },
  contentContainer: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: CONTENT_PADDING
  }
})
