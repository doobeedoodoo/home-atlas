import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { SIDEBAR_WIDTH } from '../../theme';

const NAV_ITEMS = [
  { label: 'Documents', icon: FolderOutlinedIcon, path: '/documents' },
  { label: 'Chat', icon: ChatBubbleOutlineIcon, path: '/chat' },
];

interface Props {
  onClose?: () => void;
}

export function Sidebar({ onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'User';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'U';

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  function handleSignOut() {
    setAnchorEl(null);
    void signOut(() => navigate('/login'));
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100vh',
        bgcolor: '#1C1C1C',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          HomeAtlas
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav items */}
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const selected = location.pathname.startsWith(path);
          return (
            <ListItemButton
              key={path}
              selected={selected}
              onClick={() => handleNav(path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: selected ? '#ffffff' : 'rgba(255,255,255,0.55)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.10)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: selected ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User avatar */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <ListItemButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#00897B', fontSize: '0.75rem' }}>
              {avatarLetter}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={displayName}
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              noWrap: true,
            }}
          />
        </ListItemButton>
      </Box>

      {/* User menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 220, maxWidth: 360 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2">{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem sx={{ mt: 0.5 }} onClick={() => { setAnchorEl(null); navigate('/settings'); onClose?.(); }}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Sign out</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
