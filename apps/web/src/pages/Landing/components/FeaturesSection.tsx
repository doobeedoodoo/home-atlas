import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

interface Feature {
  Icon: SvgIconComponent;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    Icon: ArchiveOutlinedIcon,
    title: 'All your paperwork, in one place',
    description:
      'Upload manuals, warranties, rental contracts, and renovation records — your home documents, organised and ready to search.',
  },
  {
    Icon: ChatBubbleOutlineIcon,
    title: 'Powered by AI',
    description:
      'Ask anything about your documents and get instant, accurate answers.',
  },
  {
    Icon: LockOutlinedIcon,
    title: 'Yours alone',
    description:
      'Your documents are private and secure — encrypted in storage and accessible only to you.',
  },
];

function FeatureCard({ Icon, title, description }: Feature) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
      }}
    >
      <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
          {description}
        </Typography>
      </Stack>
    </Box>
  );
}

export function FeaturesSection() {
  return (
    <Box component="section" id="features" sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 16 } }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 3, md: 4 } }}>
        <Stack spacing={2} alignItems="center" textAlign="center" mb={8}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Know your home
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 480, lineHeight: 1.75 }}>
            One place for every document, every answer, every detail about your property.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
