import { useQuery } from '@tanstack/react-query';
import { useUserId } from '@/hooks/use-session';

interface UserDetails {
  name?: string;
  email?: string;
  wahlkreis?: string;
  plz?: string;
  landesverband?: string;
  heimatbahnhof?: string;
  profilePictureUrl?: string;
  supabaseId?: string;
}

async function fetchUserDetails(): Promise<UserDetails> {
  const response = await fetch('/api/user-details');
  if (!response.ok) {
    throw new Error(`Failed to fetch user details: ${response.statusText}`);
  }
  return response.json();
}

export function useUserDetails() {
  const userId = useUserId(); // Only fetch if we have a user ID from session
  
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: fetchUserDetails,
    enabled: !!userId, // Only fetch if user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes - user details don't change often
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2, // Retry failed requests 2 times
  });
} 