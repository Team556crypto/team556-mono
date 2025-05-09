import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Animated, Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ScrollToTopProps {
  scrolled?: boolean;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ scrolled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateAnim = useState(new Animated.Value(40))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Show/hide based on scrolled state
  useEffect(() => {
    if (scrolled) {
      setIsVisible(true);
      
      // Fade and slide in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Fade and slide out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 40,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [scrolled, fadeAnim, translateAnim]);

  // Handle scroll to top
  const handleScrollToTop = () => {
    // Add a quick scale effect on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    // Scroll to top (web only)
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Native scroll handling needs a ref to the ScrollView
      // This component currently doesn't receive the ref, needs enhancement if native needed
      console.warn('ScrollToTop needs ScrollView ref for native platforms.');
    }
  };

  // Only render on web and when visible
  if (Platform.OS !== 'web' || !isVisible) {
    return null;
  }

  // For web platform only - add some CSS styles to the document once
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Create a style element
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .scroll-to-top-icon {
          animation: bounce 2s infinite;
        }
      `;
      // Append the style to the document head
      document.head.appendChild(style);

      // Cleanup on unmount
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <Pressable 
        style={styles.button}
        onPress={handleScrollToTop}
        aria-label="Scroll to top"
      >
        <Feather 
          name="chevron-up" 
          size={20} 
          color={Colors.text}
          className="scroll-to-top-icon"
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    elevation: 4,
    zIndex: 50,
  },
  button: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
});

export default ScrollToTop;
