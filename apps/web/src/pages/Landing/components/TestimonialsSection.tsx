import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import StarIcon from '@mui/icons-material/Star';

const TESTIMONIAL = {
  quote:
    'I used to keep a drawer full of manuals and warranties I could never find when I needed them. HomeAtlas changed that completely — I asked how to descale our coffee maker and had the answer in seconds.',
  name: 'Mac Sta Maria',
  role: 'Homeowner, Brisbane',
  initials: 'MS',
};

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={i} sx={{ fontSize: 18, color: 'primary.main' }} />
      ))}
    </Box>
  );
}

export function TestimonialsSection() {
  return (
    <Box component="section" id="testimonials" sx={{ bgcolor: 'background.paper', py: { xs: 12, md: 16 } }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 3, md: 4 } }}>
        <Stack spacing={2} alignItems="center" textAlign="center" mb={8}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
          Loved by users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            See what people are saying about HomeAtlas.
          </Typography>
        </Stack>

        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          <Box
            sx={{
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textAlign: 'center',
            }}
          >
            <StarRating />

            <Typography
              variant="body1"
              color="text.secondary"
              lineHeight={1.8}
              fontStyle="italic"
              sx={{ fontSize: '1.05rem' }}
            >
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '0.875rem', fontWeight: 700 }}>
                {TESTIMONIAL.initials}
              </Avatar>
              <Box textAlign="left">
                <Typography variant="subtitle2" fontWeight={700}>
                  {TESTIMONIAL.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {TESTIMONIAL.role}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
