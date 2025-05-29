import { useQuery } from '@tanstack/react-query';

export interface MdBUser {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  wahlkreis?: string;
  landesverband?: string;
}

export function useMdBUsers() {
  return useQuery<MdBUser[], Error>({
    queryKey: ['mdbUsers'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Failed to fetch MdB users');
      }
      return res.json();
    },
  });
} 