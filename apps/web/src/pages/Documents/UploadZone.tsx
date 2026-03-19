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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadZone({ open, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      if (!name) setName(dropped.name.replace('.pdf', ''));
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) setName(selected.name.replace('.pdf', ''));
    }
  }

  function handleClose() {
    setFile(null);
    setName('');
    setDragging(false);
    onClose();
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
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? 'rgba(0,137,123,0.04)' : 'background.default',
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(0,137,123,0.04)' },
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
                <Typography variant="body2" fontWeight={500}>
                  {file.name}
                </Typography>
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

          {/* Document name */}
          <TextField
            label="Document name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            helperText="Give it a descriptive name so you can find it later"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!file || !name.trim()} onClick={handleClose}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
