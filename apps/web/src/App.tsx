import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { AppShell } from './components/AppShell/AppShell';
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SignInPage } from './pages/Auth/SignInPage';
import { SignUpPage } from './pages/Auth/SignUpPage';
import { LandingPage } from './pages/Landing/LandingPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Public landing page — redirects signed-in users straight to the app. */
function LandingRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/documents" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login/*" element={<SignInPage />} />
      <Route path="/signup/*" element={<SignUpPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
