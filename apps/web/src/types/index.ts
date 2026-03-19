export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  uploadedAt: string;
  sizeBytes: number;
}

export interface Citation {
  id: string;
  documentName: string;
  page?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}
