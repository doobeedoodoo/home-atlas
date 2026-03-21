import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useUser } from '@clerk/react';

export function SettingsPage() {
  const { user } = useUser();

  const displayName = user?.fullName ?? '—';
  const email = user?.primaryEmailAddress?.emailAddress ?? '—';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Section title="Account">
        <Field label="Name" value={displayName} />
        <Field label="Email" value={email} />
      </Section>
    </Box>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="overline"
        sx={{ color: 'text.disabled', letterSpacing: '0.08em', fontSize: '0.7rem' }}
      >
        {title}
      </Typography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
