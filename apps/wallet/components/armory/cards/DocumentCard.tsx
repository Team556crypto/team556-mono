import React from 'react';
import Card from '@team556/ui/src/Card';
import { Document, documentTypeOptions } from '@team556/ui/src/types'

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

  const getDocumentTypeLabel = () => {
    const typeOption = documentTypeOptions.find(option => option.value === document.type);
    return typeOption ? typeOption.label : document.type || 'Document';
  };

  const getDocumentIcon = () => {
    const type = document.type?.toLowerCase() || '';
    if (type.includes('concealed') || type.includes('carry') || type.includes('permit')) {
      return 'card-account-details';
    } else if (type.includes('insurance')) {
      return 'shield-check';
    } else if (type.includes('trust')) {
      return 'account-group';
    } else if (type.includes('training') || type.includes('certificate') || type.includes('safety')) {
      return 'certificate';
    } else if (type.includes('receipt') || type.includes('purchase')) {
      return 'receipt';
    } else if (type.includes('registration')) {
      return 'file-document';
    }
    return 'file-document-outline';
  };

  return (
    <Card
      width={width}
      height={height}
      onPress={handlePress}
      onDelete={handleDelete}
      imageUri={document.attachments}
      iconName={getDocumentIcon()}
      category={getDocumentTypeLabel()}
      title={document.name}
      details={[
        document.document_number ? `#${document.document_number}` : '',
        document.expiration_date ? `Expires: ${new Date(document.expiration_date).toLocaleDateString()}` : ''
      ].filter(Boolean)}
    />
  );
}
