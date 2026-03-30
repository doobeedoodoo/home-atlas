import { SignUp } from '@clerk/react';
import Box from '@mui/material/Box';
import { PublicHeader } from '../../components/PublicHeader/PublicHeader';
import { clerkAppearance } from './clerkAppearance';

export function SignUpPage() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <PublicHeader showAuthButtons={false} showBrandName />
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 8,
          p: 2,
        }}
      >
        <SignUp routing="hash" signInUrl="/login" appearance={{ ...clerkAppearance }} />
      </Box>
    </Box>
  );
}
