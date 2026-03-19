import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { CitationChip } from '../../components/CitationChip/CitationChip';
import type { ChatMessage } from '../../types';

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
}

export function MessageList({ messages, isThinking }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          gap: 1.5,
          p: 4,
        }}
      >
        <ChatBubbleOutlineIcon sx={{ fontSize: 40 }} />
        <Typography variant="body1" fontWeight={500} color="text.primary">
          Ask anything about your documents
        </Typography>
        <Typography variant="body2" align="center">
          I&apos;ll search across all your uploaded PDFs and cite my sources.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
        {messages.map((msg) => (
          <Stack
            key={msg.id}
            direction={msg.role === 'user' ? 'row-reverse' : 'row'}
            spacing={1.5}
            alignItems="flex-start"
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: msg.role === 'user' ? 'grey.300' : 'primary.main',
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {msg.role === 'user' ? 'U' : 'AI'}
            </Avatar>
            <Box sx={{ maxWidth: '80%' }}>
              <Box
                sx={{
                  bgcolor: msg.role === 'user' ? '#1C1C1C' : 'background.paper',
                  color: msg.role === 'user' ? '#ffffff' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
              </Box>
              {msg.citations && msg.citations.length > 0 && (
                <Stack direction="row" flexWrap="wrap" spacing={0.75} sx={{ mt: 1 }}>
                  {msg.citations.map((c) => (
                    <CitationChip key={c.id} citation={c} />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        ))}

        {isThinking && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
              AI
            </Avatar>
            <Box
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={14} thickness={5} />
              <Typography variant="body2" color="text.secondary">
                Searching your documents…
              </Typography>
            </Box>
          </Stack>
        )}

        <div ref={bottomRef} />
      </Stack>
    </Box>
  );
}
