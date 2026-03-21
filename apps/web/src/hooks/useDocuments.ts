import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import type { Document } from '../types';
import {
  listDocuments,
  renameDocument,
  deleteDocument,
  requestUploadUrl,
  uploadFileToR2,
  confirmUpload,
  getDownloadUrl,
} from '../api/documents';

function needsPolling(docs: Document[] | undefined): boolean {
  return docs?.some((d) => d.status === 'pending' || d.status === 'processing') ?? false;
}

export function useDocuments() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return listDocuments(token);
    },
    // Poll every 3 s while any document is still being ingested
    refetchInterval: (query) => (needsPolling(query.state.data) ? 3000 : false),
  });
}

export function useDeleteDocument() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return deleteDocument(token, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useRenameDocument() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return renameDocument(token, id, name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUploadDocument() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');

      // Step 1: Create DB record + get presigned R2 URL
      const { documentId, uploadUrl } = await requestUploadUrl(token, {
        name,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });

      // Step 2: PUT file directly to R2 (no auth header)
      await uploadFileToR2(uploadUrl, file);

      // Step 3: Mark document as processing, trigger ingestion job (Slice 3)
      return confirmUpload(token, documentId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDownloadDocument() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return getDownloadUrl(token, id);
    },
    onSuccess: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}
