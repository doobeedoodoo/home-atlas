import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { apiFetch } from '../api/client';

interface LocalUser {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    enabled: isSignedIn === true,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const data = await apiFetch<{ user: LocalUser }>('/api/v1/users/me', token);
      return data.user;
    },
  });
}
