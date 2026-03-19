import type { Document } from '../types';
import { getMockDocuments, deleteMockDocument, renameMockDocument } from '../mocks/documents';

export async function listDocuments(): Promise<Document[]> {
  return getMockDocuments();
}

export async function deleteDocument(id: string): Promise<void> {
  deleteMockDocument(id);
}

export async function renameDocument(id: string, name: string): Promise<Document> {
  return renameMockDocument(id, name);
}
