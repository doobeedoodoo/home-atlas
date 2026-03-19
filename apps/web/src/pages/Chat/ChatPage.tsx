import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { SessionSidebar } from './SessionSidebar';
import { MessageList } from './MessageList';
import { useMessages } from '../../hooks/useChat';
import { sendMessage } from '../../api/chat';
import type { ChatMessage } from '../../types';

export function ChatPage() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [selectedSession, setSelectedSession] = useState('1');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const { data: sessionMessages } = useMessages(selectedSession);

  // Sync session messages into local state when session changes
  useEffect(() => {
    setLocalMessages(sessionMessages ?? []);
  }, [sessionMessages, selectedSession]);

  function handleNewSession() {
    setSelectedSession('');
    setLocalMessages([]);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isThinking) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const reply = await sendMessage(selectedSession, content);
      setLocalMessages((prev) => [...prev, reply]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const chatArea = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <MessageList messages={localMessages} isThinking={isThinking} />

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
            placeholder="Ask a question about your documents…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            slotProps={{ input: { disableUnderline: true, sx: { px: 1, py: 0.5, fontSize: '0.875rem' } } }}
          />
          <IconButton
            onClick={() => void handleSend()}
            disabled={!input.trim() || isThinking}
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
      <Box sx={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
        {chatArea}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      <SessionSidebar
        selectedId={selectedSession}
        onSelect={(id) => setSelectedSession(id)}
        onNew={handleNewSession}
      />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Stack sx={{ height: '100%' }}>{chatArea}</Stack>
      </Box>
    </Box>
  );
}
