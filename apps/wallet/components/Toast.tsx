import React, { useEffect } from 'react'
import { StyleSheet, View, Animated, Platform } from 'react-native'
import { Text } from '@team556/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants/Colors'
import { useToastStore } from '@/store/toastStore'
import { Ionicons } from '@expo/vector-icons'

const Toast = () => {
  const { isVisible, message, type, hideToast } = useToastStore()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    // Suppress error-type toasts entirely
    if (isVisible && type === 'error') {
      hideToast()
      return
    }
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start()
    }
  }, [isVisible, type, hideToast, fadeAnim])

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 9999,
      ...Platform.select({
        ios: {
          top: insets.top + 10,
          left: 20,
          right: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          top: insets.top + 10,
          left: 20,
          right: 20,
          elevation: 5
        },
        web: {
          bottom: 20,
          right: 20,
          maxWidth: 400,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
        }
      })
    },
    icon: {
      marginRight: 8
    },
    message: {
      color: Colors.text,
      flexShrink: 1
    }
  })

  // Do not render error toasts at all
  if (type === 'error') {
    return null
  }

  if (!message && fadeAnim === new Animated.Value(0)) {
    return null
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return Colors.success
      case 'info':
      default:
        return Colors.tint
    }
  }

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline'
      case 'info':
      default:
        return 'information-circle-outline'
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), opacity: fadeAnim }
      ]}
    >
      <Ionicons name={getIconName() as any} size={20} color={Colors.text} style={styles.icon} />
      {message && <Text style={styles.message}>{message}</Text>}
    </Animated.View>
  )
}

export default Toast
