import { useSession as useNextAuthSession } from 'next-auth/react';
import { useMemo } from 'react';

// Shared session hook that reduces redundant calls
export function useSession() {
  const session = useNextAuthSession();

  // Memoize the session data to prevent unnecessary re-renders
  const memoizedSession = useMemo(() => ({
    data: session.data,
    status: session.status,
    update: session.update,
  }), [session.data, session.status, session.update]);

  return memoizedSession;
}

// Export specific user data hooks to avoid repeated session calls
export function useUserName() {
  const { data: session } = useSession();
  return session?.user?.name;
}

export function useUserId() {
  const { data: session } = useSession();
  return session?.user?.id;
}

export function useUserEmail() {
  const { data: session } = useSession();
  return session?.user?.email;
} 