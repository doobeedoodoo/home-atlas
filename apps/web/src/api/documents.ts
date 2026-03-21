import type { Document } from '../types';
import { apiFetch, API_BASE_URL } from './client';

export async function listDocuments(token: string): Promise<Document[]> {
  const data = await apiFetch<{ documents: Document[] }>('/api/v1/documents', token);
  return data.documents;
}

export async function getDocument(token: string, id: string): Promise<Document> {
  const data = await apiFetch<{ document: Document }>(`/api/v1/documents/${id}`, token);
  return data.document;
}

export interface RequestUploadUrlParams {
  name: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export async function requestUploadUrl(
  token: string,
  params: RequestUploadUrlParams,
): Promise<{ documentId: string; uploadUrl: string }> {
  return apiFetch('/api/v1/documents/upload-url', token, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** PUT the file directly to R2 using the presigned URL — no auth header. */
export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export async function confirmUpload(token: string, documentId: string): Promise<Document> {
  const data = await apiFetch<{ document: Document }>(
    `/api/v1/documents/${documentId}/confirm`,
    token,
    { method: 'POST' },
  );
  return data.document;
}

export async function renameDocument(token: string, id: string, name: string): Promise<Document> {
  const data = await apiFetch<{ document: Document }>(`/api/v1/documents/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return data.document;
}

export async function deleteDocument(token: string, id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/documents/${id}`, token, { method: 'DELETE' });
}

export async function getDownloadUrl(token: string, id: string): Promise<string> {
  const data = await apiFetch<{ url: string }>(
    `/api/v1/documents/${id}/download-url`,
    token,
  );
  return data.url;
}

// Keep API_BASE_URL export accessible for non-authenticated fetches (e.g. R2 upload)
export { API_BASE_URL };
