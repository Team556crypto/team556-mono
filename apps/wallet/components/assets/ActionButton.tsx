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
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 80,
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

  const buttonBackground = color + '15'; // Lighter background with a subtle gradient-like effect

  return (
    <View style={styles.actionButtonColumn}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.drawerActionButton,
            { borderColor: color, backgroundColor: buttonBackground },
            {
              transform: [{ scale: pressAnim }]
            }
          ]}
        >
          <Ionicons name={icon} size={20} color={color} />
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
  },
  drawerActionButton: { // Style for the circular button in ActionButton component
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    // borderColor is set dynamically in the component
    // backgroundColor is set dynamically in the component
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: Platform.OS === 'android' ? 2 : 0, // for Android, 0 for iOS to rely on shadow props
  },
  buttonLabel: { // Style for the text label below the ActionButton
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    marginTop: -2, // Minor adjustment for visual alignment
  },
});

export default ActionButton;
