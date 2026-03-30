import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 240;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00674F',
      light: '#4DB6AC',
      dark: '#00695C',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F7F7F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
    },
    divider: '#E8E8E6',
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 137, 123, 0.10)',
            '&:hover': { backgroundColor: 'rgba(0, 137, 123, 0.14)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
