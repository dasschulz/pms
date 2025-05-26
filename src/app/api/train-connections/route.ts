import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';
import { createClient } from 'db-vendo-client';
import { profile as dbnavProfile } from 'db-vendo-client/p/dbnav/index.js';

// Create DB client with dbnav profile (stable, no API key required)
const dbClient = createClient(dbnavProfile, 'MdB-App/1.0');

// Cache for connections data with 15-minute TTL
interface CachedConnection {
  data: any;
  timestamp: number;
  userId: string;
}

let connectionsCache = new Map<string, CachedConnection>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Cleanup expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of connectionsCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      connectionsCache.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Helper function to get cached data
function getCachedConnections(userId: string, heimatbahnhof: string): any | null {
  const cacheKey = `${userId}-${heimatbahnhof}`;
  const cached = connectionsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`🎯 Using cached train connections for ${heimatbahnhof}`);
    return cached.data;
  }
  
  return null;
}

// Helper function to cache data
function setCachedConnections(userId: string, heimatbahnhof: string, data: any): void {
  const cacheKey = `${userId}-${heimatbahnhof}`;
  connectionsCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    userId
  });
  console.log(`💾 Cached train connections for ${heimatbahnhof}`);
}

// Helper function to format journey data
function formatJourney(journey: any) {
  if (!journey || !journey.legs || journey.legs.length === 0) return null;
  
  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs[journey.legs.length - 1];
  
  // Extract detailed leg information
  const legs = journey.legs.map((leg: any) => ({
    origin: {
      name: leg.origin?.name || 'Unknown',
      id: leg.origin?.id,
      platform: leg.departurePlatform || leg.origin?.platform
    },
    destination: {
      name: leg.destination?.name || 'Unknown', 
      id: leg.destination?.id,
      platform: leg.arrivalPlatform || leg.destination?.platform
    },
    departure: leg.departure,
    arrival: leg.arrival,
    line: {
      name: leg.line?.name,
      product: leg.line?.product,
      number: leg.line?.name || leg.line?.fahrtNr || leg.line?.id,
      operator: leg.line?.operator?.name,
      direction: leg.direction,
      // Store more train info for debugging
      rawLine: leg.line
    },
    duration: leg.duration,
    distance: leg.distance,
    walking: leg.walking || false,
    delay: {
      departure: leg.departureDelay || 0,
      arrival: leg.arrivalDelay || 0
    }
  }));
  
  return {
    departure: firstLeg.departure,
    arrival: lastLeg.arrival,
    duration: journey.duration || null,
    transfers: journey.legs.length - 1,
    products: journey.legs.map((leg: any) => leg.line?.product).filter(Boolean),
    delay: firstLeg.departureDelay || 0,
    // Add detailed information for expanded view
    legs: legs,
    price: journey.price,
    departurePlatform: firstLeg.departurePlatform || firstLeg.origin?.platform,
    arrivalPlatform: lastLeg.arrivalPlatform || lastLeg.destination?.platform,
    rawJourney: journey // Store raw data for debugging and future use
  };
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;
  const { searchParams } = new URL(req.url);
  const isDebug = searchParams.get('debug') === 'true';
  const forceRefresh = searchParams.get('refresh') === 'true';

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

    // If debug mode, just return the station info
    if (isDebug) {
      return NextResponse.json({
        debug: true,
        storedValue: heimatbahnhof,
        cacheInfo: {
          hasCachedData: getCachedConnections(userId, heimatbahnhof) !== null,
          cacheSize: connectionsCache.size,
        },
        config: {
          profile: 'dbnav',
          cacheTTL: `${CACHE_TTL / 1000 / 60} minutes`,
        }
      });
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedConnections(userId, heimatbahnhof);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    console.log(`🚂 Fetching fresh train connections for: ${heimatbahnhof}`);

    // Step 1: Find the home station using db-vendo-client
    let homeStation = null;
    
    try {
      console.log(`🔍 Searching for station: ${heimatbahnhof}`);
      const locations = await dbClient.locations(heimatbahnhof, {
        results: 5,
        fuzzy: true,
        stops: true,
        addresses: false,
        poi: false
      });

      if (locations && locations.length > 0) {
        homeStation = locations[0];
        console.log(`✅ Found station: ${homeStation.name} (ID: ${homeStation.id})`);
      } else {
        throw new Error('Station not found');
      }
    } catch (locationError) {
      console.error('❌ Station search failed:', locationError);
      return NextResponse.json({
        error: 'Station not found',
        message: 'Station nicht gefunden. Bitte überprüfe die Schreibweise in den Einstellungen.',
        fallback: {
          heimatbahnhof: heimatbahnhof,
          berlinHbf: 'Berlin Hbf',
          connections: {
            toBerlin: [],
            fromBerlin: [],
          },
          lastUpdated: new Date().toISOString(),
          status: 'offline'
        }
      }, { status: 404 });
    }

    // Step 2: Find Berlin Hauptbahnhof
    let berlinStation = null;
    
    try {
      const berlinLocationResults = await dbClient.locations('Berlin Hauptbahnhof', {
        results: 1,
        fuzzy: false,
        stops: true,
        addresses: false,
        poi: false
      });

      if (berlinLocationResults && berlinLocationResults.length > 0) {
        berlinStation = berlinLocationResults[0];
        console.log(`✅ Found Berlin station: ${berlinStation.name} (ID: ${berlinStation.id})`);
      } else {
        // Fallback to known Berlin Hbf ID
        berlinStation = { id: '8011160', name: 'Berlin Hbf' };
        console.log('📍 Using fallback Berlin Hbf ID');
      }
    } catch (berlinError) {
      console.error('❌ Berlin station search failed, using fallback:', berlinError);
      berlinStation = { id: '8011160', name: 'Berlin Hbf' };
    }

    // Step 3: Search for journeys
    const now = new Date();
    
    try {
      console.log(`🚂 Searching journeys: ${homeStation.name} (${homeStation.id}) ↔ ${berlinStation.name} (${berlinStation.id})`);
      
      // Note: The dbnav profile doesn't support products filtering (specific train types)
      // This means we'll get all available transport types (ICE, IC, RE, RB, S-Bahn, etc.)
      // which is actually better for comprehensive journey planning
      
      // Search for journeys to and from Berlin
      const [toBerlinJourneys, fromBerlinJourneys] = await Promise.allSettled([
        dbClient.journeys(homeStation.id, berlinStation.id, {
          departure: now,
          results: 3,
          transfers: 5,
          transferTime: 0,
          walking: true,
          bike: false
        }),
        dbClient.journeys(berlinStation.id, homeStation.id, {
          departure: now,
          results: 3,
          transfers: 5,
          transferTime: 0,
          walking: true,
          bike: false
        })
      ]);

      // Log detailed results for debugging
      console.log(`📊 Journey search results:`);
      console.log(`  - To Berlin: ${toBerlinJourneys.status}`, 
        toBerlinJourneys.status === 'rejected' ? toBerlinJourneys.reason : `${toBerlinJourneys.value?.journeys?.length || 0} journeys`);
      console.log(`  - From Berlin: ${fromBerlinJourneys.status}`, 
        fromBerlinJourneys.status === 'rejected' ? fromBerlinJourneys.reason : `${fromBerlinJourneys.value?.journeys?.length || 0} journeys`);

      // Process results
      const toBerlinData = toBerlinJourneys.status === 'fulfilled' 
        ? toBerlinJourneys.value?.journeys?.slice(0, 2).map(formatJourney).filter(Boolean) || []
        : [];
      
      const fromBerlinData = fromBerlinJourneys.status === 'fulfilled'
        ? fromBerlinJourneys.value?.journeys?.slice(0, 2).map(formatJourney).filter(Boolean) || []
        : [];

      const hasAnyData = toBerlinData.length > 0 || fromBerlinData.length > 0;
      
      const responseData = {
        heimatbahnhof: homeStation.name,
        berlinHbf: berlinStation.name,
        connections: {
          toBerlin: toBerlinData,
          fromBerlin: fromBerlinData,
        },
        lastUpdated: now.toISOString(),
        status: hasAnyData ? 'online' : 'partial',
        cacheInfo: {
          cached: false,
          validUntil: new Date(now.getTime() + CACHE_TTL).toISOString()
        }
      };

      // Cache the successful response even if no journeys found (to avoid repeated API calls)
      setCachedConnections(userId, heimatbahnhof, responseData);

      // Only return 503 if both searches failed with errors (not if they just returned no results)
      if (!hasAnyData && (toBerlinJourneys.status === 'rejected' && fromBerlinJourneys.status === 'rejected')) {
        console.log('❌ Both journey searches failed with errors');
        return NextResponse.json({ 
          error: 'Train API temporarily unavailable',
          message: 'DB-Service ist momentan nicht verfügbar. Versuche es später erneut.',
          fallback: {
            ...responseData,
            status: 'offline'
          }
        }, { status: 503 });
      }

      console.log(`✅ Journey search completed: ${toBerlinData.length} to Berlin, ${fromBerlinData.length} from Berlin`);
      return NextResponse.json(responseData);

    } catch (journeyError) {
      console.error('❌ Journey search failed:', journeyError);
      
      const fallbackData = {
        heimatbahnhof: homeStation.name,
        berlinHbf: berlinStation.name,
        connections: {
          toBerlin: [],
          fromBerlin: [],
        },
        lastUpdated: now.toISOString(),
        status: 'offline'
      };

      return NextResponse.json({ 
        error: 'Journey search failed',
        message: 'Verbindungssuche fehlgeschlagen. Versuche es später erneut.',
        fallback: fallbackData
      }, { status: 503 });
    }

  } catch (error) {
    console.error('❌ Train connections API error:', error);
    
    let userMessage = 'Verbindungsdaten derzeit nicht verfügbar';
    if (error instanceof Error) {
      if (error.message.includes('Station not found')) {
        userMessage = 'Station nicht gefunden. Bitte überprüfe die Schreibweise in den Einstellungen.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'DB-Service antwortet nicht rechtzeitig. Versuche es später erneut.';
      }
    }
    
    return NextResponse.json({ 
      error: 'Train API unavailable',
      message: userMessage,
      fallback: {
        heimatbahnhof: 'Heimatbahnhof',
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