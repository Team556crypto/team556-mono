import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, createContext, useState, ReactNode, useCallback } from 'react'
import 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { Drawer, StepForm, setAppTheme } from '@team556/ui'
import { Colors } from '@/constants/Colors'

// Configure shared UI components to use the app's colors
setAppTheme(Colors)

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// Create a context for the drawer
interface DrawerContextType {
  openDrawer: (content: ReactNode, options?: { maxHeight?: number; minHeight?: number }) => void
  closeDrawer: () => void
  isDrawerVisible: boolean
}

export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerVisible: false
})

// Create a context for the step form
interface StepFormContextType {
  openStepForm: (
    steps: Array<{ title?: string; content: ReactNode }>,
    options?: {
      initialStep?: number
      onComplete?: () => void
      completeButtonText?: string
    }
  ) => void
  closeStepForm: () => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  isStepFormVisible: boolean
  currentStep: number
}

export const StepFormContext = createContext<StepFormContextType>({
  openStepForm: () => {},
  closeStepForm: () => {},
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  isStepFormVisible: false,
  currentStep: 0
})

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

  // Drawer state
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [drawerContent, setDrawerContent] = useState<ReactNode>(null)
  const [drawerMaxHeight, setDrawerMaxHeight] = useState<number | undefined>(undefined)
  const [drawerMinHeight, setDrawerMinHeight] = useState<number | undefined>(undefined)

  // StepForm state
  const [isStepFormVisible, setIsStepFormVisible] = useState(false)
  const [stepFormSteps, setStepFormSteps] = useState<Array<{ title?: string; content: ReactNode }>>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [onCompleteCallback, setOnCompleteCallback] = useState<(() => void) | undefined>(undefined)
  const [completeButtonText, setCompleteButtonText] = useState<string | undefined>(undefined)

  const openDrawer = (content: ReactNode, options?: { maxHeight?: number; minHeight?: number }) => {
    setDrawerContent(content)
    setDrawerMaxHeight(options?.maxHeight)
    setDrawerMinHeight(options?.minHeight)
    setIsDrawerVisible(true)
  }

  console.log(process.env.EXPO_PUBLIC_TEST)

  const closeDrawer = () => {
    setIsDrawerVisible(false)
  }

  const openStepForm = useCallback(
    (
      steps: Array<{ title?: string; content: ReactNode }>,
      options?: {
        initialStep?: number
        onComplete?: () => void
        completeButtonText?: string
      }
    ) => {
      // Reset the step form state
      setCurrentStep(options?.initialStep || 0)
      setStepFormSteps(steps)
      setOnCompleteCallback(() => options?.onComplete)
      setCompleteButtonText(options?.completeButtonText)
      setIsStepFormVisible(true)
    },
    []
  )

  const closeStepForm = useCallback(() => {
    setIsStepFormVisible(false)
    // Clear form state after closing
    setTimeout(() => {
      setCurrentStep(0)
      setStepFormSteps([])
      setOnCompleteCallback(undefined)
    }, 300) // Small delay to allow animation to finish
  }, [])

  const goToNextStep = useCallback(() => {
    if (currentStep < stepFormSteps.length - 1) {
      // If not the last step, just advance to the next step
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, stepFormSteps.length])

  const handleFormComplete = useCallback(() => {
    // Only call the completion callback when explicitly completed
    if (onCompleteCallback) {
      onCompleteCallback()
    }
    // Don't auto-close, let the callback handle it if needed
  }, [onCompleteCallback])

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <StepFormContext.Provider
      value={{
        openStepForm,
        closeStepForm,
        goToNextStep,
        goToPreviousStep,
        isStepFormVisible,
        currentStep
      }}
    >
      <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerVisible }}>
        <GestureHandlerRootView style={styles.container}>
          <ThemeProvider value={DarkTheme}>
            <Stack>
              <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
              <Stack.Screen name='+not-found' />
            </Stack>
            <StatusBar style='light' />

            {/* Drawer positioned at the root level */}
            <Drawer
              isVisible={isDrawerVisible}
              onClose={closeDrawer}
              maxHeight={drawerMaxHeight}
              minHeight={drawerMinHeight}
            >
              {drawerContent}
            </Drawer>

            {/* StepForm positioned at the root level */}
            {isStepFormVisible && stepFormSteps.length > 0 && (
              <StepForm
                steps={stepFormSteps}
                currentStep={currentStep}
                onNextStep={goToNextStep}
                onPreviousStep={goToPreviousStep}
                onComplete={handleFormComplete}
                completeButtonText={completeButtonText}
              />
            )}
          </ThemeProvider>
        </GestureHandlerRootView>
      </DrawerContext.Provider>
    </StepFormContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
