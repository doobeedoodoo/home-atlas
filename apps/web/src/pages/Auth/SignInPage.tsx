import { SignIn } from '@clerk/react';
import Box from '@mui/material/Box';

export function SignInPage() {
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
      <SignIn routing="path" path="/login" signUpUrl="/signup" />
    </Box>
  );
}
