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
    return 'crosshairs';
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
