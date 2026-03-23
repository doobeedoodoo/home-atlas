import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface Props {
  /** Start transparent and transition to white on scroll. Default: false. */
  transparent?: boolean;
  /** Show Get started / Sign in buttons. Default: true. */
  showAuthButtons?: boolean;
}

export function PublicHeader({ transparent = false, showAuthButtons = true }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const triggered = useScrollTrigger({ disableHysteresis: true, threshold: 16 });
  const solid = !transparent || triggered;

  return (
    <AppBar
      position="fixed"
      elevation={solid ? 1 : 0}
      sx={{
        bgcolor: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: solid ? 'blur(8px)' : 'none',
        borderBottom: solid ? '1px solid' : 'none',
        borderColor: 'divider',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ maxWidth: 1100, mx: 'auto', width: '100%', px: { xs: 3, md: 4 }, py: { xs: 2, md: 3 } }}>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexGrow: 0 }}
        >
          <img src="/images/logo.png" alt="HomeAtlas logo" style={{ height: isMobile ? 32 : 48, width: 'auto' }} />
          <Typography variant="h5" fontWeight={700} color="text.primary"
            sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' } }}
          >
            HomeAtlas
          </Typography>
        </Box>
        
        {showAuthButtons && (
          <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
            <Button component={RouterLink} to="/signup" variant="contained" disableElevation>
              Get started
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" color="inherit" sx={{ borderColor: 'divider' }}>
              Sign in
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
