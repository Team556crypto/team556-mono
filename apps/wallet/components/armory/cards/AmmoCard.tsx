import React from 'react';
import Card from '@team556/ui/src/Card';
import { Ammo } from '@team556/ui/src/types'

interface AmmoCardProps {
  ammo: Ammo;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function AmmoCard({
  ammo,
  onPress,
  onDelete,
  width,
  height
}: AmmoCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(ammo.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(ammo.id);
    }
  };

  const getFirearmIcon = () => {
    const type = ammo.type?.toLowerCase() || '';
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
      imageUri={ammo.pictures}
      iconName={getFirearmIcon()}
      category={ammo.type || 'Firearm'}
      title={ammo.manufacturer}
      details={[
        `${ammo.manufacturer || ''} ${ammo.caliber || ''}`.trim(),
        ammo.caliber
      ]}
    />
  );
}
