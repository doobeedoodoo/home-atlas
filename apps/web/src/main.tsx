import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import { theme } from './theme';

const PUBLISHABLE_KEY = import.meta.env['VITE_CLERK_PUBLISHABLE_KEY'] as string | undefined;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/login" signInUrl="/login" signUpUrl="/signup" appearance={{ theme: 'simple' }}>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </ClerkProvider>,
);
