import { useState } from 'react';
import Chip from '@mui/material/Chip';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { useAuth } from '@clerk/react';
import { getDownloadUrl } from '../../api/documents';
import type { Citation } from '../../types';

interface Props {
  citation: Citation;
}

export function CitationChip({ citation }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const label = citation.page
    ? `${citation.documentName} · p.${citation.page}`
    : citation.documentName;

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const token = await getToken();
      const url = await getDownloadUrl(token!, citation.documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Chip
      icon={<ArticleOutlinedIcon sx={{ fontSize: '0.875rem !important' }} />}
      label={label}
      size="small"
      variant="outlined"
      color="primary"
      onClick={() => void handleClick()}
      disabled={loading}
      sx={{ fontSize: '0.6875rem', height: 22, cursor: 'pointer' }}
    />
  );
}
