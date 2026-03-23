import { SignUp } from '@clerk/react';
import Box from '@mui/material/Box';
import { PublicHeader } from '../../components/PublicHeader/PublicHeader';

export function SignUpPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicHeader showAuthButtons={false} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 8,
          p: 2,
        }}
      >
        <SignUp routing="path" path="/signup" signInUrl="/login" appearance={{ layout: { logoPlacement: 'none' } }} />
      </Box>
    </Box>
  );
}
