import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { SessionSidebar } from './SessionSidebar';
import { MessageList } from './MessageList';
import { useMessages, useCreateSession } from '../../hooks/useChat';
import { streamMessage, submitFeedback } from '../../api/chat';
import type { ChatMessage } from '../../types';

const STREAMING_ID = '__streaming__';

export function ChatPage() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const createSession = useCreateSession();

  const [selectedSession, setSelectedSession] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);

  async function handleFeedback(messageId: string, value: 1 | -1) {
    const token = await getToken();
    if (!token) return;
    await submitFeedback(messageId, value, token);
  }

  const { data: sessionMessages } = useMessages(selectedSession);

  // Sync server messages into local state when session changes
  useEffect(() => {
    setLocalMessages(sessionMessages ?? []);
  }, [sessionMessages, selectedSession]);

  function handleNewSession() {
    setSelectedSession('');
    setLocalMessages([]);
  }

  function handleSelectSession(id: string) {
    setSelectedSession(id);
    setLocalMessages([]);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    abortRef.current = false;

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // Create a new session if none is selected
      let sessionId = selectedSession;
      if (!sessionId) {
        const session = await createSession.mutateAsync();
        sessionId = session.id;
        setSelectedSession(sessionId);
      }

      await streamMessage(sessionId, content, token, (event) => {
        if (abortRef.current) return;

        if (event.type === 'user_message' && event.message) {
          setLocalMessages((prev) => [...prev, event.message!]);
          // Add a placeholder for the streaming assistant message
          setLocalMessages((prev) => [
            ...prev,
            { id: STREAMING_ID, role: 'assistant', content: '', createdAt: new Date().toISOString() },
          ]);
        } else if (event.type === 'token' && event.token) {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID ? { ...m, content: m.content + event.token! } : m,
            ),
          );
        } else if (event.type === 'done' && event.message) {
          setLocalMessages((prev) =>
            prev.map((m) => (m.id === STREAMING_ID ? event.message! : m)),
          );
          void queryClient.invalidateQueries({ queryKey: ['sessions'] });
          void queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
        } else if (event.type === 'error') {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID
                ? { ...m, content: event.error ?? 'An error occurred. Please try again.' }
                : m,
            ),
          );
        }
      });
    } catch (err) {
      setLocalMessages((prev) =>
        prev.filter((m) => m.id !== STREAMING_ID).concat({
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'An error occurred. Please try again.',
          createdAt: new Date().toISOString(),
        }),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // isThinking = streaming but no assistant token yet
  const isThinking = isStreaming && !localMessages.some((m) => m.id === STREAMING_ID && m.content);

  const chatArea = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <MessageList messages={localMessages} isThinking={isThinking} onFeedback={handleFeedback} />

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paper
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1, borderRadius: 3 }}
        >
          <TextField
            multiline
            maxRows={6}
            fullWidth
            placeholder="Ask anything about your documents…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            slotProps={{ input: { disableUnderline: true, sx: { px: 1, py: 0.5, fontSize: '0.875rem' } } }}
          />
          <IconButton
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            size="small"
            sx={{
              bgcolor: input.trim() ? 'primary.main' : 'grey.200',
              color: input.trim() ? '#fff' : 'text.disabled',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'grey.200', color: 'text.disabled' },
              flexShrink: 0,
              mb: 0.25,
            }}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100dvh - 48px)', display: 'flex', flexDirection: 'column' }}>
        {chatArea}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100dvh', display: 'flex', overflow: 'hidden' }}>
      <SessionSidebar
        selectedId={selectedSession}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
      />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Stack sx={{ height: '100%' }}>{chatArea}</Stack>
      </Box>
    </Box>
  );
}
