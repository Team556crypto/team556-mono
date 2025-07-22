import React from 'react';
import Card from '@team556/ui/src/Card';
import { Document } from '@team556/ui/src/types'

interface DocumentCardProps {
  document: Document;
  onPress?: (id: number) => void;
  onDelete?: (id: number) => void;
  width?: number;
  height?: number;
}

export default function DocumentCard({
  document,
  onPress,
  onDelete,
  width,
  height
}: DocumentCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(document.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(document.id);
    }
  };

  const getFirearmIcon = () => {
    const type = document.type?.toLowerCase() || '';
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
      imageUri={document.attachments}
      iconName={getFirearmIcon()}
      category={document.type || 'Firearm'}
      title={document.name}
      details={[
        `${document.name || ''} ${document.type || ''}`.trim(),
        document.expiration_date
      ]}
    />
  );
}
