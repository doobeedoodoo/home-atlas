import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useDocuments, useDeleteDocument, useRenameDocument } from '../../hooks/useDocuments';
import type { Document, DocumentStatus } from '../../types';

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CHIP: Record<DocumentStatus, { label: string; color: 'success' | 'warning' | 'default' | 'error' }> = {
  ready: { label: 'Ready', color: 'success' },
  processing: { label: 'Processing', color: 'warning' },
  pending: { label: 'Pending', color: 'default' },
  failed: { label: 'Failed', color: 'error' },
};

interface RowMenuProps {
  document: Document;
  onRename: () => void;
  onDelete: () => void;
}

function RowMenu({ onRename, onDelete }: RowMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setAnchor(null); onRename(); }}>
          <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
          <Typography variant="body2">Rename</Typography>
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onDelete(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" color="error" /></ListItemIcon>
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export function DocumentList() {
  const { data: documents, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();
  const renameDoc = useRenameDocument();

  const [renameTarget, setRenameTarget] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function openRename(doc: Document) {
    setRenameTarget(doc);
    setRenameValue(doc.name);
  }

  function confirmRename() {
    if (renameTarget && renameValue.trim()) {
      renameDoc.mutate({ id: renameTarget.id, name: renameValue.trim() });
    }
    setRenameTarget(null);
  }

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} />
        ))}
      </Stack>
    );
  }

  if (!documents?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <PictureAsPdfOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" fontWeight={500}>
          No documents yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a PDF to get started
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {documents.map((doc, idx) => (
          <Box key={doc.id}>
            {idx > 0 && <Divider />}
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ px: 2.5, py: 1.75, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
            >
              <PictureAsPdfOutlinedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {doc.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(doc.uploadedAt)} · {formatBytes(doc.sizeBytes)}
                </Typography>
              </Box>
              <Chip
                label={STATUS_CHIP[doc.status].label}
                color={STATUS_CHIP[doc.status].color}
                size="small"
                sx={{ flexShrink: 0 }}
              />
              <RowMenu
                document={doc}
                onRename={() => openRename(doc)}
                onDelete={() => deleteDoc.mutate(doc.id)}
              />
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Rename dialog */}
      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmRename} disabled={!renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
