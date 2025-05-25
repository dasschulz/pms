import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';

// Use require for db-stations to avoid TypeScript issues
const { readStations } = require('db-stations');

// Cache for the stations data (loaded once per server startup)
let stationsCache: any[] | null = null;

// Load stations into memory (only once)
async function loadStations() {
  if (stationsCache) return stationsCache;
  
  console.log('🚂 Loading DB stations database...');
  const stations = [];
  
  try {
    for await (const station of readStations()) {
      stations.push({
        id: station.id,
        name: station.name,
        location: station.location,
        weight: station.weight,
        ril100: station.ril100,
        city: station.address?.city,
      });
    }
    
    stationsCache = stations;
    console.log(`✅ Loaded ${stations.length} DB stations into cache`);
    return stations;
  } catch (error) {
    console.error('❌ Failed to load DB stations:', error);
    return [];
  }
}

// Find station by name with fuzzy matching
function findStation(query: string, stations: any[]) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact match first
  let match = stations.find(s => s.name.toLowerCase() === normalizedQuery);
  if (match) return match;
  
  // Try common variations
  const variations = [
    normalizedQuery,
    normalizedQuery.replace('hauptbahnhof', 'hbf'),
    normalizedQuery.replace('hbf', 'hauptbahnhof'),
    normalizedQuery.replace(' hbf', ' hauptbahnhof'),
    normalizedQuery.replace(' hauptbahnhof', ' hbf'),
    normalizedQuery + ' hbf',
    normalizedQuery + ' hauptbahnhof',
  ];
  
  // Try each variation
  for (const variation of variations) {
    match = stations.find(s => s.name.toLowerCase() === variation);
    if (match) return match;
  }
  
  // Partial matches (starts with)
  for (const variation of variations) {
    match = stations.find(s => s.name.toLowerCase().startsWith(variation));
    if (match) return match;
  }
  
  // City name matches
  match = stations.find(s => s.city && s.city.toLowerCase() === normalizedQuery);
  if (match) return match;
  
  return null;
}

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry API calls
async function retryApiCall<T>(
  apiCall: () => Promise<T>, 
  retries: number = 2, 
  delayMs: number = 1000
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0) {
      console.log(`API call failed, retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return retryApiCall(apiCall, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;
  const { searchParams } = new URL(req.url);
  const isDebug = searchParams.get('debug') === 'true';

  try {
    // First, get the user's Heimatbahnhof from Airtable
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: ['Heimatbahnhof', 'Name'],
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    const heimatbahnhof = userRecord.get('Heimatbahnhof') as string | undefined;
    
    if (!heimatbahnhof) {
      return NextResponse.json({ 
        error: 'No Heimatbahnhof configured',
        message: 'Bitte konfiguriere deinen Heimatbahnhof in den Einstellungen' 
      }, { status: 404 });
    }

    // If debug mode, just return the station info without making API calls
    if (isDebug) {
      const generateSearchVariations = (stationName: string): string[] => {
        const variations = [stationName];
        
        if (stationName.includes('Hauptbahnhof')) {
          variations.push(stationName.replace('Hauptbahnhof', 'Hbf'));
          variations.push(stationName.replace('Hauptbahnhof', 'HBF'));
        }
        if (stationName.includes('Hbf')) {
          variations.push(stationName.replace('Hbf', 'Hauptbahnhof'));
          variations.push(stationName.replace('Hbf', 'HBF'));
        }
        if (stationName.includes('HBF')) {
          variations.push(stationName.replace('HBF', 'Hauptbahnhof'));
          variations.push(stationName.replace('HBF', 'Hbf'));
        }
        
        const cityName = stationName.split(' ')[0];
        if (cityName !== stationName) {
          variations.push(cityName);
          variations.push(`${cityName} Hbf`);
          variations.push(`${cityName} Hauptbahnhof`);
        }
        
        return [...new Set(variations)];
      };

      return NextResponse.json({
        debug: true,
        storedValue: heimatbahnhof,
        searchVariations: generateSearchVariations(heimatbahnhof),
        encoding: {
          original: heimatbahnhof,
          encoded: encodeURIComponent(heimatbahnhof),
          bytes: [...new TextEncoder().encode(heimatbahnhof)],
        }
      });
    }

    // First, try to resolve station using local DB
    const stations = await loadStations();
    let selectedStation = null;
    let heimatbahnhofId = null;
    
    if (stations.length > 0) {
      selectedStation = findStation(heimatbahnhof, stations);
      if (selectedStation) {
        heimatbahnhofId = selectedStation.id;
        console.log(`✅ Found station locally: "${selectedStation.name}" (ID: ${heimatbahnhofId})`);
      }
    }
    
    // If local lookup failed, fall back to API search
    if (!selectedStation) {
      console.log(`🔍 Local lookup failed for "${heimatbahnhof}", trying API...`);
      
      // Helper function to search for a station with a specific query
      const searchStation = async (query: string) => {
        console.log(`🔍 Trying search query: "${query}"`);
        
        // First try the DB-specific stations endpoint (better for our use case)
        try {
          console.log(`🚆 Trying DB stations autocomplete for: "${query}"`);
          const stationsResponse = await fetch(
            `https://v5.db.transport.rest/stations?query=${encodeURIComponent(query)}&limit=5&fuzzy=true&completion=true`,
            {
              headers: {
                'User-Agent': 'MdB-App/1.0',
              },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (stationsResponse.ok) {
            const stationsData = await stationsResponse.json();
            // Convert stations object to array format
            const stationsArray = Object.values(stationsData).map((station: any) => ({
              type: 'station',
              id: station.id,
              name: station.name,
              location: station.location
            }));
            
            console.log(`🎯 DB stations found ${stationsArray.length} results for "${query}":`, 
              stationsArray.slice(0, 3).map((loc: any) => loc.name));
            
            if (stationsArray.length > 0) {
              return stationsArray;
            }
          }
        } catch (stationsError) {
          console.log(`❌ DB stations search failed for "${query}":`, stationsError);
        }

        // Fallback to general locations endpoint with better parameters
        console.log(`🗺️ Trying general locations search for: "${query}"`);
        const locationResponse = await fetch(
          `https://v5.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=5&stops=true&addresses=false&poi=false&fuzzy=true&language=de`,
          {
            headers: {
              'User-Agent': 'MdB-App/1.0',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!locationResponse.ok) {
          throw new Error(`Location search failed: ${locationResponse.status}`);
        }

        const locationsData = await locationResponse.json();
        console.log(`📍 General locations found ${locationsData?.length || 0} results for "${query}":`, 
          locationsData?.slice(0, 3).map((loc: any) => loc.name) || []);
        
        return locationsData;
      };

      // Generate search variations for German station names
      const generateSearchVariations = (stationName: string): string[] => {
        const variations = [stationName]; // Start with original
        
        // Convert common abbreviations
        if (stationName.includes('Hauptbahnhof')) {
          variations.push(stationName.replace('Hauptbahnhof', 'Hbf'));
          variations.push(stationName.replace('Hauptbahnhof', 'HBF'));
        }
        if (stationName.includes('Hbf')) {
          variations.push(stationName.replace('Hbf', 'Hauptbahnhof'));
          variations.push(stationName.replace('Hbf', 'HBF'));
        }
        if (stationName.includes('HBF')) {
          variations.push(stationName.replace('HBF', 'Hauptbahnhof'));
          variations.push(stationName.replace('HBF', 'Hbf'));
        }
        
        // Add variations with just the city name (for major stations)
        const cityName = stationName.split(' ')[0];
        if (cityName !== stationName) {
          variations.push(cityName);
          variations.push(`${cityName} Hbf`);
          variations.push(`${cityName} Hauptbahnhof`);
        }
        
        // Remove duplicates
        return [...new Set(variations)];
      };

      const searchVariations = generateSearchVariations(heimatbahnhof);
      console.log(`🔄 Will try ${searchVariations.length} search variations:`, searchVariations);

      let locations: any = null;
      let successfulQuery = '';

      // Try each variation until we find results
      for (const variation of searchVariations) {
        try {
          const result = await retryApiCall(() => searchStation(variation));
          if (result && result.length > 0) {
            locations = result;
            successfulQuery = variation;
            console.log(`✅ Found station with query: "${variation}"`);
            break;
          }
        } catch (variationError) {
          console.log(`❌ Variation "${variation}" failed:`, variationError);
          continue;
        }
      }

      if (!locations || locations.length === 0) {
        console.error(`❌ No station found for any variation of: "${heimatbahnhof}"`);
        throw new Error('Station not found');
      }

      selectedStation = locations[0];
      heimatbahnhofId = selectedStation.id;
      
      console.log(`🎯 Using station: "${selectedStation.name}" (ID: ${heimatbahnhofId})`);
      if (successfulQuery !== heimatbahnhof) {
        console.log(`📝 Note: Found with search query "${successfulQuery}" instead of original "${heimatbahnhof}"`);
      }
    }

    // Continue with journey search using the resolved station
    console.log(`🚂 Searching journeys for station: "${selectedStation.name}" (${heimatbahnhofId})`);
    
    // Define Berlin Hauptbahnhof station ID (from DB API)
    const berlinHbfId = '8011160';

    // Get current time for journey searches
    const now = new Date();
    const departure = now.toISOString();

    // Search for journeys with retry logic
    const [toBerlinData, fromBerlinData] = await Promise.allSettled([
      retryApiCall(async () => {
        const response = await fetch(
          `https://v5.db.transport.rest/journeys?from=${heimatbahnhofId}&to=${berlinHbfId}&departure=${departure}&results=3&transfers=5&nationalExpress=true&national=true&regionalExp=true&regional=true`,
          {
            headers: {
              'User-Agent': 'MdB-App/1.0',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          throw new Error(`Journey search failed: ${response.status}`);
        }

        return response.json();
      }),
      retryApiCall(async () => {
        const response = await fetch(
          `https://v5.db.transport.rest/journeys?from=${berlinHbfId}&to=${heimatbahnhofId}&departure=${departure}&results=3&transfers=5&nationalExpress=true&national=true&regionalExp=true&regional=true`,
          {
            headers: {
              'User-Agent': 'MdB-App/1.0',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          throw new Error(`Journey search failed: ${response.status}`);
        }

        return response.json();
      })
    ]);

    // Process and format the results
    const formatJourney = (journey: any) => {
      if (!journey || !journey.legs) return null;
      
      const firstLeg = journey.legs[0];
      const lastLeg = journey.legs[journey.legs.length - 1];
      
      return {
        departure: firstLeg.departure,
        arrival: lastLeg.arrival,
        duration: journey.duration,
        transfers: journey.legs.length - 1,
        products: journey.legs.map((leg: any) => leg.line?.product || 'unknown'),
        delay: firstLeg.departureDelay || 0,
      };
    };

    const toBerlinJourneys = toBerlinData.status === 'fulfilled' 
      ? toBerlinData.value?.journeys?.slice(0, 2).map(formatJourney).filter(Boolean) || []
      : [];
    
    const fromBerlinJourneys = fromBerlinData.status === 'fulfilled'
      ? fromBerlinData.value?.journeys?.slice(0, 2).map(formatJourney).filter(Boolean) || []
      : [];

    // Check if we got any data
    const hasAnyData = toBerlinJourneys.length > 0 || fromBerlinJourneys.length > 0;
    
    if (!hasAnyData && (toBerlinData.status === 'rejected' || fromBerlinData.status === 'rejected')) {
      // If both failed, return service unavailable with cached fallback
      return NextResponse.json({ 
        error: 'Train API temporarily unavailable',
        message: 'DB-Service ist momentan nicht verfügbar. Versuche es später erneut.',
        fallback: {
          heimatbahnhof: selectedStation.name,
          berlinHbf: 'Berlin Hbf',
          connections: {
            toBerlin: [],
            fromBerlin: [],
          },
          lastUpdated: now.toISOString(),
          status: 'offline'
        }
      }, { status: 503 });
    }

    return NextResponse.json({
      heimatbahnhof: selectedStation.name,
      berlinHbf: 'Berlin Hbf',
      connections: {
        toBerlin: toBerlinJourneys,
        fromBerlin: fromBerlinJourneys,
      },
      lastUpdated: now.toISOString(),
      status: hasAnyData ? 'online' : 'partial'
    });

  } catch (apiError) {
    console.error('DB API Error:', apiError);
    
    // Provide more specific error messages
    let userMessage = 'Verbindungsdaten derzeit nicht verfügbar';
    if (apiError instanceof Error) {
      if (apiError.message.includes('Station not found')) {
        userMessage = 'Station nicht gefunden. Bitte überprüfe die Schreibweise in den Einstellungen.';
      } else if (apiError.message.includes('503')) {
        userMessage = 'DB-Service ist momentan überlastet. Versuche es in wenigen Minuten erneut.';
      } else if (apiError.message.includes('timeout')) {
        userMessage = 'Verbindung zum DB-Service zeitüberschreitung. Überprüfe deine Internetverbindung.';
      }
    }
    
    return NextResponse.json({ 
      error: 'Train API unavailable',
      message: userMessage,
      fallback: {
        heimatbahnhof: 'Nicht verfügbar',
        berlinHbf: 'Berlin Hbf',
        connections: {
          toBerlin: [],
          fromBerlin: [],
        },
        lastUpdated: new Date().toISOString(),
        status: 'offline'
      }
    }, { status: 503 });
  }
} 