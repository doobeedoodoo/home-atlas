import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useUploadDocument } from '../../hooks/useDocuments';

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadZone({ open, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  function selectFile(f: File) {
    if (f.type !== 'application/pdf') {
      setValidationError('Only PDF files are supported.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setValidationError('File exceeds the 50 MB limit.');
      return;
    }
    setValidationError(null);
    setFile(f);
    if (!name) setName(f.name.replace(/\.pdf$/i, ''));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
  }

  function handleClose() {
    if (upload.isPending) return;
    setFile(null);
    setName('');
    setDragging(false);
    setValidationError(null);
    upload.reset();
    onClose();
  }

  async function handleUpload() {
    if (!file || !name.trim()) return;
    await upload.mutateAsync({ file, name: name.trim() });
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload document</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !upload.isPending && inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: upload.isPending ? 'default' : 'pointer',
              bgcolor: dragging ? 'rgba(0,137,123,0.04)' : 'background.default',
              transition: 'all 0.15s',
              '&:hover': upload.isPending
                ? {}
                : { borderColor: 'primary.light', bgcolor: 'rgba(0,137,123,0.04)' },
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileInput}
            />
            {file ? (
              <Stack alignItems="center" spacing={1}>
                <InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="body2" fontWeight={500}>{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1_000_000).toFixed(1)} MB
                </Typography>
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={1}>
                <UploadFileIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={500}>
                  Drag and drop a PDF here
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  or click to browse · max 50 MB
                </Typography>
              </Stack>
            )}
          </Box>

          {validationError && <Alert severity="error">{validationError}</Alert>}
          {upload.isError && (
            <Alert severity="error">
              {upload.error instanceof Error ? upload.error.message : 'Upload failed'}
            </Alert>
          )}

          {/* Document name */}
          <TextField
            label="Document name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={upload.isPending}
            helperText="Give it a descriptive name so you can find it later"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={upload.isPending}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!file || !name.trim() || upload.isPending}
          onClick={handleUpload}
          startIcon={upload.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
