import React from 'react';
import Card from '@team556/ui/src/Card';
import { NFA } from '@team556/ui/src/types'

interface NFACardProps {
  nfa: NFA;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function NFACard({
  nfa,
  onPress,
  onDelete,
  width,
  height
}: NFACardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(nfa.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(nfa.id);
    }
  };

  const getFirearmIcon = () => {
    const type = nfa.type?.toLowerCase() || '';
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
      imageUri={nfa.picture}
      iconName={getFirearmIcon()}
      category={nfa.type || 'Firearm'}
      title={nfa.manufacturer}
      details={[
        `${nfa.manufacturer || ''} ${nfa.model_name || ''}`.trim(),
        nfa.caliber
      ]}
    />
  );
}
