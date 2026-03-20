import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { AppShell } from './components/AppShell/AppShell';
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { SignInPage } from './pages/Auth/SignInPage';
import { SignUpPage } from './pages/Auth/SignUpPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/*" element={<SignInPage />} />
      <Route path="/signup/*" element={<SignUpPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>
    </Routes>
  );
}
