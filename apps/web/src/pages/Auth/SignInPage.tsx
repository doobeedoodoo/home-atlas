import { SignIn } from '@clerk/react';
import Box from '@mui/material/Box';
import { PublicHeader } from '../../components/PublicHeader/PublicHeader';

export function SignInPage() {
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
        <SignIn routing="path" path="/login" signUpUrl="/signup" appearance={{ layout: { logoPlacement: 'none' } }} />
      </Box>
    </Box>
  );
}
