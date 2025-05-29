import { useQuery } from '@tanstack/react-query';
import { useUserId } from '@/hooks/use-session';

interface JourneyLeg {
  origin: {
    name: string;
    id?: string;
    platform?: string;
  };
  destination: {
    name: string;
    id?: string;
    platform?: string;
  };
  departure: string;
  arrival: string;
  direction?: string;
  line: {
    name?: string;
    product?: string;
    number?: string;
    operator?: string;
    direction?: string;
    rawLine?: any;
  };
  duration?: number;
  distance?: number;
  walking: boolean;
  delay: {
    departure: number;
    arrival: number;
  };
}

interface Journey {
  departure: string;
  arrival: string;
  duration: number | null;
  transfers: number;
  products: string[];
  delay: number;
  legs: JourneyLeg[];
  price?: any;
  departurePlatform?: string;
  arrivalPlatform?: string;
  rawJourney?: any;
}

interface TrainConnections {
  heimatbahnhof: string;
  berlinHbf: string;
  connections: {
    toBerlin: Journey[];
    fromBerlin: Journey[];
  };
  lastUpdated: string;
  status?: 'online' | 'offline' | 'partial';
  cacheInfo?: {
    cached: boolean;
    validUntil: string;
  };
}

async function fetchTrainConnections(forceRefresh: boolean = false): Promise<TrainConnections> {
  const url = forceRefresh ? '/api/train-connections?refresh=true' : '/api/train-connections';
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      const data = await response.json();
      throw new Error(data.error === 'No Heimatbahnhof configured' ? 'NO_HEIMATBAHNHOF' : data.message || 'Station nicht gefunden');
    } else if (response.status === 503) {
      const data = await response.json();
      if (data.fallback) {
        return data.fallback;
      }
      throw new Error(data.message || 'Service momentan nicht verfügbar');
    }
    const data = await response.json();
    throw new Error(`HTTP ${response.status}: ${data.message || data.error || 'Fehler beim Laden der Verbindungen'}`);
  }
  
  return response.json();
}

export function useTrainConnections(forceRefresh: boolean = false) {
  const userId = useUserId(); // Only fetch if user is authenticated
  
  return useQuery({
    queryKey: ['train-connections', userId, forceRefresh ? 'force' : 'normal'],
    queryFn: () => fetchTrainConnections(forceRefresh),
    enabled: !!userId, // Only fetch if user is authenticated
    staleTime: 15 * 60 * 1000, // 15 minutes - matches backend cache
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if it's a missing Heimatbahnhof error
      if (error.message === 'NO_HEIMATBAHNHOF') {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: 16 * 60 * 1000, // 16 minutes - slightly longer than backend cache
  });
} 