import { create } from 'zustand';
import { getDocuments, updateDocument, createDocument, deleteDocument } from '@/services/api';
import type { Document, UpdateDocumentPayload, CreateDocumentPayload } from '@team556/ui';
import { useAuthStore } from './authStore';

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  hasAttemptedInitialFetch: boolean;
  addDocument: (payload: CreateDocumentPayload, token: string | null) => Promise<boolean>;
  updateDocument: (documentId: number, payload: UpdateDocumentPayload, token: string | null) => Promise<void>;
  deleteDocument: (documentId: number, token: string | null) => Promise<void>;
  _updateLocalDocument: (updatedDocument: Document) => void;
  setDocuments: (documents: Document[]) => void;
  getDocumentById: (documentId: number) => Document | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchInitialDocuments: (token: string | null) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),

  addDocument: async (payload, token) => {
    const tempId = Date.now();
    const tempDocument: Document = {
      ...payload,
      id: tempId,
      owner_user_id: useAuthStore.getState().user?.id || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set(state => ({ documents: [...state.documents, tempDocument] }));

    try {
      const newDocumentFromApi = await createDocument(payload, token);
      set(state => ({
        documents: state.documents.map(d => (d.id === tempId ? newDocumentFromApi : d)),
        isLoading: false
      }));
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add document';
      set(state => ({ 
        error: errorMessage, 
        isLoading: false,
        documents: state.documents.filter(d => d.id !== tempId)
      }));
      return false;
    }
  },

  _updateLocalDocument: updatedDocument =>
    set(state => ({
      documents: state.documents.map(d => (d.id === updatedDocument.id ? updatedDocument : d))
    })),

  updateDocument: async (documentId, payload, token) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDocumentFromApi = await updateDocument(documentId, payload, token);
      get()._updateLocalDocument(updatedDocumentFromApi);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update document';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteDocument: async (documentId, token) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDocument(documentId, token);
      set(state => ({
        documents: state.documents.filter(d => d.id !== documentId),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete document';
      set({ error: errorMessage, isLoading: false });
      get().fetchInitialDocuments(token);
      throw error;
    }
  },

  setDocuments: documents => set({ documents }),

  getDocumentById: documentId => {
    return get().documents.find(d => d.id === documentId);
  },

  fetchInitialDocuments: async token => {
    set({ isLoading: true, error: null });
    try {
      const fetchedDocuments = await getDocuments(token, { limit: 50 }); 
      set({ documents: fetchedDocuments, isLoading: false, hasAttemptedInitialFetch: true });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch documents';
      set({ error: errorMessage, isLoading: false, hasAttemptedInitialFetch: true });
    }
  }
}));
