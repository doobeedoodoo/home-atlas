import type { Document } from '../types';

const initial: Document[] = [
  {
    id: '1',
    name: 'Samsung 65" TV Manual',
    status: 'ready',
    uploadedAt: '2026-03-10T10:00:00Z',
    sizeBytes: 2_400_000,
  },
  {
    id: '2',
    name: 'House Floor Plan 2024',
    status: 'ready',
    uploadedAt: '2026-03-12T14:30:00Z',
    sizeBytes: 5_100_000,
  },
  {
    id: '3',
    name: 'DeLonghi Coffee Maker Manual',
    status: 'processing',
    uploadedAt: '2026-03-19T08:00:00Z',
    sizeBytes: 1_200_000,
  },
  {
    id: '4',
    name: 'Land Title Certificate',
    status: 'pending',
    uploadedAt: '2026-03-19T09:45:00Z',
    sizeBytes: 890_000,
  },
];

let store: Document[] = [...initial];

export function getMockDocuments(): Document[] {
  return [...store];
}

export function deleteMockDocument(id: string): void {
  store = store.filter((d) => d.id !== id);
}

export function renameMockDocument(id: string, name: string): Document {
  const doc = store.find((d) => d.id === id);
  if (!doc) throw new Error('Document not found');
  doc.name = name;
  return { ...doc };
}
