import React from 'react';
import Card from '@team556/ui/src/Card';
import { NFA, nfaTypeOptions } from '@team556/ui/src/types'

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

  const getNFATypeLabel = () => {
    const typeOption = nfaTypeOptions.find(option => option.value === nfa.type);
    return typeOption ? typeOption.label : nfa.type || 'NFA Item';
  };

  const getNFAIcon = () => {
    const type = nfa.type?.toLowerCase() || '';
    if (type.includes('suppressor')) {
      return 'volume-off';
    } else if (type.includes('sbr') || type.includes('rifle')) {
      return 'target';
    } else if (type.includes('sbs') || type.includes('shotgun')) {
      return 'crosshairs';
    } else if (type.includes('machine_gun')) {
      return 'alarm-light';
    } else if (type.includes('destructive')) {
      return 'bomb';
    } else if (type.includes('aow')) {
      return 'pistol';
    }
    return 'shield-check';
  };

  return (
    <Card
      width={width}
      height={height}
      onPress={handlePress}
      onDelete={handleDelete}
      imageUri={nfa.picture}
      iconName={getNFAIcon()}
      category={getNFATypeLabel()}
      title={nfa.manufacturer}
      details={[
        `${nfa.manufacturer || ''} ${nfa.model_name || ''}`.trim(),
        nfa.caliber
      ]}
    />
  );
}
