import type { Document } from '../types';

const initial: Document[] = [
  {
    id: '1',
    name: 'Samsung 65" TV Manual',
    status: 'ready',
    mime_type: 'application/pdf',
    file_size_bytes: 2_400_000,
    page_count: null,
    error_message: null,
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'House Floor Plan 2024',
    status: 'ready',
    mime_type: 'application/pdf',
    file_size_bytes: 5_100_000,
    page_count: null,
    error_message: null,
    created_at: '2026-03-12T14:30:00Z',
    updated_at: '2026-03-12T14:30:00Z',
  },
  {
    id: '3',
    name: 'DeLonghi Coffee Maker Manual',
    status: 'processing',
    mime_type: 'application/pdf',
    file_size_bytes: 1_200_000,
    page_count: null,
    error_message: null,
    created_at: '2026-03-19T08:00:00Z',
    updated_at: '2026-03-19T08:00:00Z',
  },
  {
    id: '4',
    name: 'Land Title Certificate',
    status: 'pending',
    mime_type: 'application/pdf',
    file_size_bytes: 890_000,
    page_count: null,
    error_message: null,
    created_at: '2026-03-19T09:45:00Z',
    updated_at: '2026-03-19T09:45:00Z',
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
