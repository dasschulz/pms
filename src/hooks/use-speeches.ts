import { useQuery } from '@tanstack/react-query';
import { useUserId } from '@/hooks/use-session';

interface Speech {
  date: string;
  title: string;
  url: string;
  party?: string;
  topic?: string;
  content?: string;
  // Additional properties used by the dashboard component
  agendaItem?: string;
  session?: {
    label: string;
    date: string;
  };
  videoFileURI?: string;
  audioFileURI?: string;
  text?: string;
  speechContent?: string;
  transcriptSentences?: Array<{
    text: string;
    timeStart: number;
    timeEnd: number;
    speaker?: string;
  }>;
  speaker?: string;
}

interface SpeechesResponse {
  speeches: Speech[];
  total: number;
  page: number;
  totalPages: number;
  // Also support the meta format from the API
  meta?: {
    total: number;
    perPage: number;
    page: number;
    maxPages: number;
  };
}

async function fetchSpeeches(name: string, page: number = 1): Promise<SpeechesResponse> {
  const response = await fetch(`/api/reden?name=${encodeURIComponent(name)}&page=${page}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch speeches: ${response.statusText}`);
  }
  const data = await response.json();
  
  // Transform API response to consistent format
  return {
    speeches: data.speeches || [],
    total: data.meta?.total || data.total || 0,
    page: data.meta?.page || data.page || page,
    totalPages: data.meta?.maxPages || data.totalPages || 1,
    meta: data.meta, // Keep original meta for backward compatibility
  };
}

export function useSpeeches(name: string, page: number = 1, enabled: boolean = true) {
  const userId = useUserId(); // Check if user is authenticated
  
  return useQuery({
    queryKey: ['speeches', userId, name, page],
    queryFn: () => fetchSpeeches(name, page),
    enabled: enabled && !!name && !!userId, // Only fetch if name is provided, enabled, and user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes - speeches don't change frequently
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Hook specifically for the latest speech (first page)
export function useLatestSpeech(name: string, enabled: boolean = true) {
  const userId = useUserId(); // Check if user is authenticated
  const query = useSpeeches(name, 1, enabled && !!userId);
  
  return {
    ...query,
    data: query.data?.speeches?.[0] || null, // Return just the first speech
    latestSpeech: query.data?.speeches?.[0] || null,
  };
} 