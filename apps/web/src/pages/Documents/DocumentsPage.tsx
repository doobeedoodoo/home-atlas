import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { DocumentList } from './DocumentList';
import { UploadZone } from './UploadZone';

export function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5">Documents</Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload PDF
        </Button>
      </Box>

      <DocumentList />
      <UploadZone open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Box>
  );
}
