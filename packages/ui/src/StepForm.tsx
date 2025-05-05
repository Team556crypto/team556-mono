import React, { useState, useCallback, ReactNode, Fragment, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing
} from 'react-native'
import { DefaultColors, ThemeColors } from '../constants/Colors'
import Button from './button'
import Text, { TextPreset } from './Text'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// --- Responsive Design Values ---
const basePadding = 20
const smallScreenPadding = 15
const horizontalPadding = SCREEN_WIDTH < 375 ? smallScreenPadding : basePadding
const verticalPadding = basePadding

// Responsive Text Styles
const titlePreset: TextPreset = SCREEN_WIDTH < 375 ? 'h4' : 'h3'
const stepTextSize = SCREEN_WIDTH < 375 ? 12 : 14
// --- End Responsive Design Values ---

export type StepFormButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

export interface StepFormProps {
  // Step content and navigation
  steps: {
    content: ReactNode
    title?: string
  }[]
  currentStep?: number
  onNextStep?: () => void
  onPreviousStep?: () => void
  onComplete?: () => void

  // Custom button options
  nextButtonText?: string
  previousButtonText?: string
  completeButtonText?: string
  nextButtonVariant?: StepFormButtonVariant
  previousButtonVariant?: StepFormButtonVariant
  completeButtonVariant?: StepFormButtonVariant
  hideNextButton?: boolean
  hidePreviousButton?: boolean
  disableNextButton?: boolean
  disablePreviousButton?: boolean

  // Styling options
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  headerStyle?: StyleProp<ViewStyle>
  footerStyle?: StyleProp<ViewStyle>
  progressBarStyle?: StyleProp<ViewStyle>
  progressBarFilledStyle?: StyleProp<ViewStyle>
  colors?: Partial<ThemeColors>
}

export default function StepForm({
  steps,
  currentStep = 0,
  onNextStep,
  onPreviousStep,
  onComplete,
  nextButtonText = 'Next',
  previousButtonText = 'Back',
  completeButtonText = 'Complete',
  nextButtonVariant = 'primary',
  previousButtonVariant = 'outline',
  completeButtonVariant = 'primary',
  hideNextButton = false,
  hidePreviousButton = false,
  disableNextButton = false,
  disablePreviousButton = false,
  style,
  contentContainerStyle,
  headerStyle,
  footerStyle,
  colors = {}
}: StepFormProps): JSX.Element {
  // Merge provided colors with defaults
  const themeColors = { ...DefaultColors, ...colors }

  // Progress animation value
  const progressAnim = useState(new Animated.Value(0))[0]

  // Validate step information
  const totalSteps = steps.length
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  // Calculate progress percentage for progress bar
  // For three steps: step 0 = 0, step 1 = 0.5, step 2 = 1.0
  let progress = 0
  if (totalSteps > 1) {
    progress = Math.min(currentStep / (totalSteps - 1), 1)
  }

  // Animate progress bar on step change
  useEffect(() => {
    // Animate only the progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Needs to be false for layout properties like width
    }).start()
  }, [currentStep, progressAnim, progress])

  // Event handlers
  const handleNext = useCallback(() => {
    if (isLastStep) {
      // On last step, call the completion handler
      if (onComplete) {
        onComplete()
      }
    } else {
      // Otherwise move to next step
      onNextStep?.()
    }
  }, [isLastStep, onComplete, onNextStep])

  const handlePrevious = useCallback(() => {
    onPreviousStep?.()
  }, [onPreviousStep])

  const currentStepContent = steps[currentStep]?.content
  const currentStepTitle = steps[currentStep]?.title

  // Progress bar animation - calibrated to match step positions
  // We need to carefully control the width to ensure it only goes between circles
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    // Slightly adjust to ensure it doesn't go past the last circle
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp' // Prevent the bar from exceeding the limits
  })

  return (
    // Use SafeAreaView as the root, styled to fill the screen
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundDarker }, style]}>
      <StatusBar barStyle='light-content' />

      {/* Header with progress bar and title */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }, headerStyle]}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {/* Track (Background line) */}
          <View style={styles.progressTrack} />

          {/* Progress fill */}
          <Animated.View
            style={[styles.progressFill, { width: progressBarWidth, backgroundColor: themeColors.tint }]}
          />

          {/* Step circles */}
          <View style={styles.stepsContainer}>
            {steps.map((_, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <View
                  key={`step-${index}`}
                  style={[
                    styles.stepCircle,
                    { backgroundColor: isActive || isCompleted ? themeColors.tint : 'rgba(200, 200, 200, 1)' }
                  ]}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )
            })}
          </View>
        </View>

        {currentStepTitle && (
          <Text preset={titlePreset} style={styles.stepTitle}>
            {currentStepTitle}
          </Text>
        )}

        <Text style={[styles.stepText, { fontSize: stepTextSize, color: themeColors.text }]}>
          Step {`${currentStep + 1}`} of {`${totalSteps}`}
        </Text>
      </View>

      {/* Main content area */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        <Fragment>{currentStepContent}</Fragment>
      </View>

      {/* Footer with navigation buttons */}
      <View style={[styles.footer, { borderTopColor: 'rgba(255, 255, 255, 0.1)' }, footerStyle]}>
        <View style={styles.buttonContainer}>
          {!hidePreviousButton && !isFirstStep && (
            <Button
              title={previousButtonText}
              variant={previousButtonVariant}
              disabled={disablePreviousButton}
              onPress={handlePrevious}
              style={styles.button}
              leftIcon={
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.buttonNavIcon}>←</Text>
                </View>
              }
            />
          )}

          {!hideNextButton && (
            <Button
              title={isLastStep ? completeButtonText : nextButtonText}
              variant={isLastStep ? completeButtonVariant : nextButtonVariant}
              disabled={disableNextButton}
              onPress={handleNext}
              style={[styles.button, !hidePreviousButton && !isFirstStep ? styles.buttonRight : styles.buttonFull]}
              rightIcon={
                !isLastStep ? (
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.buttonNavIcon}>→</Text>
                  </View>
                ) : undefined
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    flexDirection: 'column'
  },
  header: {
    paddingHorizontal: horizontalPadding,
    paddingTop: verticalPadding,
    paddingBottom: verticalPadding / 2,
    borderBottomWidth: 1
  },
  progressContainer: {
    position: 'relative',
    width: '100%',
    height: 40,
    marginBottom: 15,
    alignSelf: 'center',
    paddingHorizontal: 20 // Add horizontal padding to contain circles
  },
  progressTrack: {
    position: 'absolute',
    left: 12, // Start from first circle
    right: 12, // End at last circle
    height: 3,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    top: 20, // Align with circles
    zIndex: 1
  },
  progressFill: {
    position: 'absolute',
    height: 3,
    left: 12, // Match track's left position
    top: 20, // Match track's top position
    zIndex: 2
  },
  stepsContainer: {
    position: 'absolute',
    top: 0, // Align with the top
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    zIndex: 3
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  activeStepCircle: {
    transform: [{ scale: 1.1 }]
  },
  completedStepCircle: {
    backgroundColor: 'transparent'
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  stepTitle: {
    marginBottom: 8,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center'
  },
  stepText: {
    textAlign: 'center',
    marginBottom: 10
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: horizontalPadding,
    paddingTop: verticalPadding,
    paddingBottom: verticalPadding / 2
  },
  footer: {
    paddingHorizontal: horizontalPadding,
    paddingTop: verticalPadding,
    paddingBottom: verticalPadding,
    borderTopWidth: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    minWidth: 130,
    height: 50
  },
  buttonRight: {
    flex: 1,
    marginLeft: 16
  },
  buttonFull: {
    width: '100%'
  },
  buttonIconContainer: {
    padding: 2
  },
  buttonNavIcon: {
    fontSize: 16,
    color: '#fff'
  }
})
