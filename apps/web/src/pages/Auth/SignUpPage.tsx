import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';

export function SignUpPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 400, p: 4 }} elevation={0} variant="outlined">
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start organising your home documents
        </Typography>

        <Stack spacing={2}>
          <TextField label="Full name" fullWidth />
          <TextField label="Email address" type="email" fullWidth />
          <TextField label="Password" type="password" fullWidth />
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/documents')}
          >
            Create account
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/login')}
            sx={{ color: 'primary.main' }}
          >
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
