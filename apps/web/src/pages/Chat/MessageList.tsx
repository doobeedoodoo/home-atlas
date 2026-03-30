import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ReactMarkdown from 'react-markdown';
import { CitationChip } from '../../components/CitationChip/CitationChip';
import type { ChatMessage } from '../../types';

const FEEDBACK_ENABLED = import.meta.env['VITE_ENABLE_FEEDBACK'] === 'true';

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
  onFeedback?: (messageId: string, value: 1 | -1) => Promise<void>;
}

interface FeedbackButtonsProps {
  messageId: string;
  onFeedback: (messageId: string, value: 1 | -1) => Promise<void>;
}

function FeedbackButtons({ messageId, onFeedback }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick(value: 1 | -1) {
    if (loading || submitted !== null) return;
    setLoading(true);
    try {
      await onFeedback(messageId, value);
      setSubmitted(value);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack direction="row" spacing={0.25} sx={{ mt: 0.5 }}>
      <Tooltip title="Good response">
        <span>
          <IconButton
            size="small"
            disabled={loading || submitted !== null}
            onClick={() => void handleClick(1)}
            sx={{ color: submitted === 1 ? 'primary.main' : 'text.disabled', p: 0.5 }}
          >
            {submitted === 1 ? (
              <ThumbUpIcon sx={{ fontSize: 14 }} />
            ) : (
              <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Bad response">
        <span>
          <IconButton
            size="small"
            disabled={loading || submitted !== null}
            onClick={() => void handleClick(-1)}
            sx={{ color: submitted === -1 ? 'error.main' : 'text.disabled', p: 0.5 }}
          >
            {submitted === -1 ? (
              <ThumbDownIcon sx={{ fontSize: 14 }} />
            ) : (
              <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export function MessageList({ messages, isThinking, onFeedback }: Props) {
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
          How can I help?
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
        {messages.filter((msg) => msg.role === 'user' || msg.content).map((msg) => (
          <Stack
            key={msg.id}
            direction={msg.role === 'user' ? 'row-reverse' : 'row'}
            spacing={1.5}
            alignItems="flex-start"
          >
            <Box sx={{ maxWidth: '80%' }}>
              <Box
                sx={{
                  bgcolor: msg.role === 'user' ? 'text.primary' : 'background.paper',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                }}
              >
                {msg.role === 'assistant' ? (
                  <Box
                    sx={{
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                      '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                      '& strong': { fontWeight: 700 },
                      '& em': { fontStyle: 'italic' },
                      '& ul, & ol': { pl: 2.5, my: 0.5 },
                      '& li': { mb: 0.25 },
                      '& code': { fontFamily: 'monospace', fontSize: '0.8125rem', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 },
                    }}
                  >
                    <ReactMarkdown>{msg.content.replace(/\[\d+\]/g, '').trim()}</ReactMarkdown>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                )}
              </Box>
              {msg.role === 'assistant' && ((msg.citations?.length ?? 0) > 0 || (FEEDBACK_ENABLED && onFeedback && msg.id !== '__streaming__')) && (
                <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={0.75} sx={{ mt: 1, width: '100%', alignItems: 'flex-end' }}>
                  {msg.citations
                    ?.filter((c, i, arr) => arr.findIndex((x) => x.documentId === c.documentId && x.page === c.page) === i)
                    .map((c) => (
                      <CitationChip key={`${c.chunkId}-${c.page ?? 'no-page'}`} citation={c} />
                    ))}
                  {FEEDBACK_ENABLED && onFeedback && msg.id !== '__streaming__' && (
                    <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                      <FeedbackButtons messageId={msg.id} onFeedback={onFeedback} />
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        ))}

        {isThinking && (
          <Stack direction="row" spacing={1.5} alignItems="center">
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
