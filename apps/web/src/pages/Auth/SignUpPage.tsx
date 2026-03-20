import { SignUp } from '@clerk/react';
import Box from '@mui/material/Box';

export function SignUpPage() {
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
      <SignUp routing="path" path="/signup" signInUrl="/login" />
    </Box>
  );
}
