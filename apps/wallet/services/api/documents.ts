import { apiClient } from './client';
import type { Document, CreateDocumentPayload, UpdateDocumentPayload } from '@team556/ui';

export const getDocuments = async (
  token: string | null,
  params?: { limit?: number; page?: number }
): Promise<Document[]> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<Document[]>({
    method: 'GET',
    endpoint: '/documents',
    token,
    params
  });
};

export const createDocument = async (
  payload: CreateDocumentPayload,
  token: string | null
): Promise<Document> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<Document>({
    method: 'POST',
    endpoint: '/documents',
    token,
    body: payload
  });
};

export const updateDocument = async (
  documentId: number,
  payload: UpdateDocumentPayload,
  token: string | null
): Promise<Document> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<Document>({
    method: 'PUT',
    endpoint: `/documents/${documentId}`,
    token,
    body: payload
  });
};

export const deleteDocument = async (
  documentId: number,
  token: string | null
): Promise<void> => {
  if (!token) {
    return Promise.reject(new Error('Authentication token not provided.'));
  }
  return apiClient<void>({
    method: 'DELETE',
    endpoint: `/documents/${documentId}`,
    token
  });
};
