import type { ChatSession, ChatMessage } from '../types';
import { mockSessions, mockMessages } from '../mocks/chat';

export async function listSessions(): Promise<ChatSession[]> {
  return mockSessions;
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  return mockMessages[sessionId] ?? [];
}

export async function sendMessage(_sessionId: string, content: string): Promise<ChatMessage> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: `mock-${Date.now()}`,
    role: 'assistant',
    content: `This is a mock response to your question: "${content}"\n\nIn a real session, I would search your documents and return a cited answer here.`,
    citations: [],
    createdAt: new Date().toISOString(),
  };
}
