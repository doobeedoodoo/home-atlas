import { API_BASE_URL, apiFetch } from './client';
import type { ChatSession, ChatMessage, Citation } from '../types';

interface SessionResponse {
  session: { id: string; title: string; created_at: string; updated_at: string };
}

interface SessionsResponse {
  sessions: Array<{ id: string; title: string; created_at: string; updated_at: string }>;
}

interface MessagesResponse {
  session: { id: string; title: string; created_at: string; updated_at: string };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations: Citation[];
    created_at: string;
  }>;
}

function toSession(raw: { id: string; title: string; created_at: string; updated_at: string }): ChatSession {
  return { id: raw.id, title: raw.title, updatedAt: raw.updated_at };
}

function toMessage(raw: {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  created_at: string;
}): ChatMessage {
  return {
    id: raw.id,
    role: raw.role,
    content: raw.content,
    citations: raw.citations,
    createdAt: raw.created_at,
  };
}

export async function listSessions(token: string): Promise<ChatSession[]> {
  const res = await apiFetch<SessionsResponse>('/api/v1/chat/sessions', token);
  return res.sessions.map(toSession);
}

export async function createSession(token: string): Promise<ChatSession> {
  const res = await apiFetch<SessionResponse>('/api/v1/chat/sessions', token, { method: 'POST' });
  return toSession(res.session);
}

export async function getSessionMessages(sessionId: string, token: string): Promise<ChatMessage[]> {
  const res = await apiFetch<MessagesResponse>(`/api/v1/chat/sessions/${sessionId}`, token);
  return res.messages.map(toMessage);
}

export async function deleteSession(sessionId: string, token: string): Promise<void> {
  await apiFetch<void>(`/api/v1/chat/sessions/${sessionId}`, token, { method: 'DELETE' });
}

export async function submitFeedback(
  messageId: string,
  value: 1 | -1,
  token: string,
): Promise<void> {
  await apiFetch<void>(`/api/v1/chat/messages/${messageId}/feedback`, token, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export interface SseEvent {
  type: 'user_message' | 'token' | 'done' | 'error';
  message?: ChatMessage;
  token?: string;
  error?: string;
}

/**
 * Streams a message to a chat session over SSE.
 * Calls onEvent for each SSE event received.
 * Returns when the stream ends.
 */
export async function streamMessage(
  sessionId: string,
  content: string,
  token: string,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>)['error'])
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const event = JSON.parse(raw) as SseEvent;
        onEvent(event);
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}
