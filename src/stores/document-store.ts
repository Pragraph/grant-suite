import { create } from "zustand";
import { storage } from "@/lib/storage";
import type { Document } from "@/lib/types";

interface DocumentState {
  documents: Document[];
  loading: boolean;

  // Actions
  loadDocuments: (projectId: string) => Promise<void>;
  saveDocument: (projectId: string, doc: Document) => Promise<void>;
  getDocumentContent: (
    projectId: string,
    canonicalName: string
  ) => Promise<Document | null>;
  getDocumentsByPhase: (phase: number) => Document[];
  clearDocuments: () => void;
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  loading: false,

  loadDocuments: async (projectId) => {
    set({ loading: true });
    const docs = await storage.getDocuments(projectId);
    set({ documents: docs, loading: false });
  },

  saveDocument: async (projectId, doc) => {
    await storage.saveDocument(projectId, doc);
    // Reload to pick up the new document
    const docs = await storage.getDocuments(projectId);
    set({ documents: docs });
  },

  getDocumentContent: async (projectId, canonicalName) => {
    return storage.getDocument(projectId, canonicalName);
  },

  getDocumentsByPhase: (phase) => {
    return get().documents.filter((d) => d.phase === phase && d.isCurrent);
  },

  clearDocuments: () => {
    set({ documents: [], loading: false });
  },
}));
