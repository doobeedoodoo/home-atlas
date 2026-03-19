import Chip from '@mui/material/Chip';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import type { Citation } from '../../types';

interface Props {
  citation: Citation;
}

export function CitationChip({ citation }: Props) {
  const label = citation.page
    ? `${citation.documentName} · p.${citation.page}`
    : citation.documentName;

  return (
    <Chip
      icon={<ArticleOutlinedIcon sx={{ fontSize: '0.875rem !important' }} />}
      label={label}
      size="small"
      variant="outlined"
      color="primary"
      sx={{ fontSize: '0.6875rem', height: 22 }}
    />
  );
}
