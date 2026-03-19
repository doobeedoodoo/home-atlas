import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import { useSessions } from '../../hooks/useChat';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function SessionSidebar({ selectedId, onSelect, onNew }: Props) {
  const { data: sessions, isLoading } = useSessions();

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          fullWidth
          onClick={onNew}
          sx={{ justifyContent: 'flex-start' }}
        >
          New chat
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
        Recent
      </Typography>

      {isLoading ? (
        <Stack spacing={0.5} sx={{ px: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={48} />)}
        </Stack>
      ) : (
        <List disablePadding sx={{ px: 1, overflowY: 'auto', flexGrow: 1 }}>
          {(sessions ?? []).map((session) => (
            <ListItemButton
              key={session.id}
              selected={session.id === selectedId}
              onClick={() => onSelect(session.id)}
              sx={{ borderRadius: 2, mb: 0.25 }}
            >
              <ListItemText
                primary={session.title}
                secondary={formatRelative(session.updatedAt)}
                primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ fontSize: '0.6875rem' }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
