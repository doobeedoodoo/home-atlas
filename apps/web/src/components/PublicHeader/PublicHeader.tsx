import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useScrollTrigger from '@mui/material/useScrollTrigger';

interface Props {
  /** Start transparent and transition to white on scroll. Default: false. */
  transparent?: boolean;
  /** Show Get started / Sign in buttons. Default: true. */
  showAuthButtons?: boolean;
}

export function PublicHeader({ transparent = false, showAuthButtons = true }: Props) {
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
      <Toolbar sx={{ maxWidth: 1100, mx: 'auto', width: '100%', px: { xs: 3, md: 4 }, py: 3 }}>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexGrow: 0 }}
        >
          <span style={{ fontSize: 36 }}>🏠</span>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            HomeAtlas
          </Typography>
        </Box>
        
        {showAuthButtons && (
          <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
            <Button component={RouterLink} to="/signup" variant="contained" disableElevation>
              Get started
            </Button>
            <Button component={RouterLink} to="/login" color="inherit" >
              Sign in
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
