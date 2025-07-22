import React from 'react';
import Card from '@team556/ui/src/Card';
import { Firearm } from '@team556/ui/src/types';

interface FirearmCardProps {
  firearm: Firearm;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function FirearmCard({
  firearm,
  onPress,
  onDelete,
  width,
  height
}: FirearmCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(firearm.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(firearm.id);
    }
  };

  const getFirearmIcon = () => {
    const type = firearm.type?.toLowerCase() || '';
    if (type.includes('pistol') || type.includes('handgun')) {
      return 'target';
    } else if (type.includes('rifle') || type.includes('shotgun')) {
      return 'crosshairs';
    } else if (type.includes('nfa')) {
      return 'shield';
    }
    return 'crosshairs-gps';
  };

  return (
    <Card
      width={width}
      height={height}
      onPress={handlePress}
      onDelete={handleDelete}
      imageUri={firearm.image}
      iconName={getFirearmIcon()}
      category={firearm.type || 'Firearm'}
      title={firearm.name}
      details={[
        `${firearm.manufacturer || ''} ${firearm.model_name || ''}`.trim(),
        firearm.caliber
      ]}
    />
  );
}
