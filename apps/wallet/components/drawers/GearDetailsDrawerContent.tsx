import React from 'react';
import { View } from 'react-native';
import { Text, Gear } from '@team556/ui';

interface GearDetailsDrawerContentProps {
  gear: Gear;
}

export const GearDetailsDrawerContent = ({ gear }: GearDetailsDrawerContentProps) => {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{gear.name}</Text>
      <Text>Details about the gear will be shown here.</Text>
    </View>
  );
};
