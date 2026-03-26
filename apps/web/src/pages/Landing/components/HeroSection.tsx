import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        pt: 8,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 3, md: 4 }, py: { xs: 6, md: 14 }, width: '100%' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: { xs: 8, lg: 10 },
            alignItems: 'center',
          }}
        >
          {/* Text column */}
          <Stack spacing={4}>
            <Stack spacing={2.5}>
              <Typography
                variant="h3"
                fontWeight={800}
                letterSpacing="-0.02em"
                lineHeight={1.15}
                sx={{ fontSize: { xs: '2.25rem', md: '2.75rem', lg: '3rem' } }}
              >
                Your home's AI knowledge hub
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                HomeAtlas keeps your documents in one place — then lets you ask questions about any of it.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                disableElevation
                sx={{ borderRadius: 2.5, fontWeight: 600, px: 4 }}
              >
                Get started →
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="large"
                color="inherit"
                sx={{ borderRadius: 2.5, fontWeight: 500, px: 4, borderColor: 'divider', color: 'text.secondary' }}
              >
                Sign in
              </Button>
            </Stack>
          </Stack>

          {/* Image column */}
          <Box sx={{ position: 'relative' }}>
            <Box
              component="picture"
              sx={{ display: 'block', width: '100%' }}
            >
              <source srcSet="/images/landingpagephoto.webp" type="image/webp" />
              <Box
                component="img"
                src="/images/landingpagephoto.png"
                alt="A calm, well-organised living room representing a well-managed home"
                fetchPriority="high"
                sx={{
                  width: '100%',
                  aspectRatio: '4/3',
                  objectFit: 'cover',
                  borderRadius: 4,
                  display: 'block',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
