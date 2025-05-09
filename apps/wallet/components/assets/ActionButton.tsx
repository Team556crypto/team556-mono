import React, { useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from '@team556/ui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color }) => {
  // Animation for button press
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.92,
      friction: 4,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  // Dynamic styles
  const buttonBackground = color + '20'; // Lighter background

  return (
    <View style={styles.actionButtonColumn}>
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn} 
        onPressOut={handlePressOut} 
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.drawerActionButton,
            { 
              borderColor: color, 
              backgroundColor: buttonBackground,
              shadowColor: color,
            },
            {
              transform: [{ scale: pressAnim }]
            }
          ]}
        >
          <Ionicons name={icon} size={24} color={color} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.buttonLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtonColumn: {
    alignItems: 'center',
    flex: 1, // Ensure it takes up space in the row
    paddingHorizontal: 8,
  },
  drawerActionButton: { // Style for the circular button in ActionButton component
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    // borderColor is set dynamically in the component
    // backgroundColor is set dynamically in the component
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 6 : 0, // for Android, 0 for iOS to rely on shadow props
    overflow: 'hidden', // To contain the glow effect
    position: 'relative',
  },

  buttonLabel: { // Style for the text label below the ActionButton
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ActionButton;
