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
    backgroundColor: Colors.solanaNavy,
    ...(Platform.OS === 'web' 
      ? {
          background: `linear-gradient(135deg, ${Colors.solanaDark} 0%, ${Colors.solanaNavy} 50%, ${Colors.solanaDark} 100%)`,
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
          background: `radial-gradient(circle at 25% 25%, ${Colors.solanaPurple}1A 0%, transparent 50%), 
                       radial-gradient(circle at 75% 75%, ${Colors.solanaMain}1A 0%, transparent 50%)`,
        }
      : {}),
  }
});

export default BackgroundEffects;
