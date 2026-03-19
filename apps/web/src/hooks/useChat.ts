import { useQuery } from '@tanstack/react-query';
import { listSessions, getMessages } from '../api/chat';

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: listSessions });
}

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => getMessages(sessionId),
    enabled: sessionId.length > 0,
  });
}
