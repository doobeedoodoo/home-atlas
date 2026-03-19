import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h4" fontWeight={500}>
        HomeAtlas
      </Typography>
    </Box>
  );
}