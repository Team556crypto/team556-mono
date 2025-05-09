import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

const BackgroundEffects: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Static background */}
      <View style={styles.background} />
      
      {/* Simple gradient overlay */}
      {Platform.OS === 'web' && <View style={styles.gradientOverlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: -1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundDarkest,
    ...(Platform.OS === 'web' 
      ? {
          backgroundImage: `linear-gradient(135deg, ${Colors.backgroundDarkest} 0%, ${Colors.backgroundDark} 50%, ${Colors.backgroundDarkest} 100%)`,
        } 
      : {}),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    ...(Platform.OS === 'web'
      ? {
          // Multiple radial gradients for a more complex effect
          backgroundImage: `radial-gradient(circle at 25% 25%, ${Colors.primarySubtle} 0%, transparent 50%), 
                         radial-gradient(circle at 75% 25%, ${Colors.secondarySubtle} 0%, transparent 50%), 
                         radial-gradient(circle at 50% 75%, ${Colors.primarySubtle} 0%, transparent 60%)`,
          opacity: 0.2, // Keep it subtle
        }
      : {}),
  }
});

export default BackgroundEffects;
