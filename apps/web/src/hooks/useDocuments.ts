import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDocuments, deleteDocument, renameDocument } from '../api/documents';

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: listDocuments });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useRenameDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameDocument(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}
