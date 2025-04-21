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
import Button from './Button'
import Text from './Text'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

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
  progressBarStyle,
  progressBarFilledStyle,
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

  // Progress calculation
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0

  // Animate progress bar on step change
  useEffect(() => {
    // Animate only the progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
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

  // Progress bar animation
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  })

  return (
    <View style={styles.overlay}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundDark }, style]}>
          <StatusBar barStyle='light-content' />

          {/* Header with progress bar and title */}
          <View style={[styles.header, headerStyle]}>
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
                {steps.map((_, index) => (
                  <View
                    key={`step-${index}`}
                    style={[
                      styles.stepCircle,
                      index <= currentStep && { borderColor: themeColors.tint },
                      index < currentStep && styles.completedStepCircle,
                      index === currentStep && styles.activeStepCircle,
                      index === currentStep && { backgroundColor: themeColors.tint }
                    ]}
                  >
                    {index < currentStep && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                ))}
              </View>
            </View>

            {currentStepTitle && (
              <Text preset='h3' style={styles.stepTitle}>
                {currentStepTitle}
              </Text>
            )}

            <Text style={styles.stepText}>
              Step {`${currentStep + 1}`} of {`${totalSteps}`}
            </Text>
          </View>

          {/* Main content area */}
          <View style={[styles.contentContainer, contentContainerStyle]}>
            <Fragment>{currentStepContent}</Fragment>
          </View>

          {/* Footer with navigation buttons */}
          <View style={[styles.footer, footerStyle]}>
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999,
    elevation: 999
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  progressContainer: {
    height: 40,
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'center'
  },
  progressTrack: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -1
  },
  progressFill: {
    position: 'absolute',
    height: 2,
    left: 0,
    top: '50%',
    marginTop: -1
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeStepCircle: {
    borderWidth: 0
  },
  completedStepCircle: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  stepTitle: {
    marginBottom: 8,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center'
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4
  },
  contentContainer: {
    flex: 1,
    padding: 24
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
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
