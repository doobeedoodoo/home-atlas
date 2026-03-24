import { SignIn } from '@clerk/react';
import Box from '@mui/material/Box';
import { PublicHeader } from '../../components/PublicHeader/PublicHeader';
import { clerkAppearance } from './clerkAppearance';

export function SignInPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicHeader showAuthButtons={false} showBrandName />
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
        <SignIn routing="hash" signUpUrl="/signup" appearance={clerkAppearance} />
      </Box>
    </Box>
  );
}
