import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function LandingFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'grey.400' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 3, md: 4 }, py: 8 }}>
        <Typography variant="body1" color="grey.700">
          &copy; {new Date().getFullYear()} HomeAtlas. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
