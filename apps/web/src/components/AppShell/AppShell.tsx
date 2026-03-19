import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Sidebar } from './Sidebar';
import { SIDEBAR_WIDTH } from '../../theme';

export function AppShell() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <>
          <AppBar position="fixed" sx={{ bgcolor: '#1C1C1C', boxShadow: 'none' }}>
            <Toolbar variant="dense">
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                HomeAtlas
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </Drawer>
        </>
      ) : (
        <Box sx={{ position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
          <Sidebar />
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          mt: isMobile ? '48px' : 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
