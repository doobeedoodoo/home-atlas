import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { listSessions, createSession, getSessionMessages, deleteSession } from '../api/chat';

export function useSessions() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const token = await getToken();
      return listSessions(token!);
    },
  });
}

export function useMessages(sessionId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      const token = await getToken();
      return getSessionMessages(sessionId, token!);
    },
    enabled: sessionId.length > 0,
  });
}

export function useCreateSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return createSession(token!);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useDeleteSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const token = await getToken();
      return deleteSession(sessionId, token!);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
