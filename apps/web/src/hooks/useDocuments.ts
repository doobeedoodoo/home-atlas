import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';

import {
  listDocuments,
  renameDocument,
  deleteDocument,
  requestUploadUrl,
  uploadFileToR2,
  confirmUpload,
  getDownloadUrl,
} from '../api/documents';


const PROCESSING_STATUSES = new Set(['pending', 'processing']);

export function useDocuments() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return listDocuments(token);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    // Poll every 3 s while any document is still ingesting; stop once all settle.
    // TODO(SSE): Replace with server-pushed status updates.
    // See docs/architecture.md § "Document Status SSE (Planned)" for the design.
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs) return false;
      return docs.some((d) => PROCESSING_STATUSES.has(d.status)) ? 3_000 : false;
    },
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

      // Step 3: Mark document as processing, trigger ingestion job
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
