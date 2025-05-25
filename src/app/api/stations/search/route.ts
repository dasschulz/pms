import { NextRequest, NextResponse } from 'next/server';

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
      // Only include stations with reasonable weight (filter out very small stops)
      if (station.weight && station.weight > 10) {
        stations.push({
          id: station.id,
          name: station.name,
          type: 'station',
          location: station.location,
          weight: station.weight,
          ril100: station.ril100,
          city: station.address?.city,
          // Assume train services for stations with good weight
          products: {
            nationalExpress: station.weight > 500,
            national: station.weight > 200,
            regionalExp: station.weight > 50,
            regional: true
          }
        });
      }
    }
    
    // Sort by weight (importance) descending for better search results
    stations.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    stationsCache = stations;
    
    console.log(`✅ Loaded ${stations.length} DB stations into cache`);
    return stations;
  } catch (error) {
    console.error('❌ Failed to load DB stations:', error);
    return [];
  }
}

// Fuzzy search function
function fuzzySearch(query: string, stations: any[], limit: number = 8) {
  const normalizedQuery = query.toLowerCase().trim();
  const results: any[] = [];
  
  if (!normalizedQuery || normalizedQuery.length < 2) return [];
  
  // Search scoring algorithm
  for (const station of stations) {
    const name = station.name.toLowerCase();
    const city = station.city?.toLowerCase() || '';
    
    let score = 0;
    
    // Exact name match (highest priority)
    if (name === normalizedQuery) {
      score = 1000 + (station.weight || 0);
    }
    // Name starts with query
    else if (name.startsWith(normalizedQuery)) {
      score = 800 + (station.weight || 0);
    }
    // City name exact match
    else if (city === normalizedQuery) {
      score = 700 + (station.weight || 0);
    }
    // City starts with query
    else if (city.startsWith(normalizedQuery)) {
      score = 600 + (station.weight || 0);
    }
    // Name contains query
    else if (name.includes(normalizedQuery)) {
      score = 400 + (station.weight || 0);
    }
    // City contains query
    else if (city.includes(normalizedQuery)) {
      score = 300 + (station.weight || 0);
    }
    // Handle common abbreviations
    else {
      const queryVariations = [
        normalizedQuery.replace('hauptbahnhof', 'hbf'),
        normalizedQuery.replace('hbf', 'hauptbahnhof'),
        normalizedQuery.replace('bahnhof', 'bf'),
        normalizedQuery.replace(' bf', ' bahnhof'),
      ];
      
      for (const variation of queryVariations) {
        if (name.includes(variation) || city.includes(variation)) {
          score = 200 + (station.weight || 0);
          break;
        }
      }
    }
    
    if (score > 0) {
      results.push({ ...station, searchScore: score });
    }
  }
  
  // Sort by search score descending and return top results
  return results
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, limit)
    .map(({ searchScore, ...station }) => station);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const useLocal = searchParams.get('local') !== 'false'; // Default to using local DB

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // First, try local DB stations search (faster and more reliable)
    if (useLocal) {
      const stations = await loadStations();
      if (stations.length > 0) {
        const localResults = fuzzySearch(query, stations, 8);
        
        if (localResults.length > 0) {
          console.log(`🎯 Found ${localResults.length} local DB stations for "${query}":`, 
            localResults.slice(0, 3).map(s => s.name));
          return NextResponse.json(localResults);
        }
      }
    }

    // Fallback to API search (original implementation)
    console.log(`🌐 Falling back to API search for "${query}"`);
    
    // First try the DB-specific stations endpoint
    try {
      const stationsResponse = await fetch(
        `https://v5.db.transport.rest/stations?query=${encodeURIComponent(query)}&limit=8&fuzzy=true&completion=true`,
        {
          headers: {
            'User-Agent': 'MdB-App/1.0',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json();
        // Convert stations object to array format
        const stationsArray = Object.values(stationsData).map((station: any) => ({
          id: station.id,
          name: station.name,
          type: 'station',
          location: station.location,
          weight: station.weight || 0,
        }));
        
        if (stationsArray.length > 0) {
          // Sort by weight (relevance) descending
          stationsArray.sort((a: any, b: any) => (b.weight || 0) - (a.weight || 0));
          console.log(`🎯 API stations found ${stationsArray.length} results for "${query}"`);
          return NextResponse.json(stationsArray);
        }
      }
    } catch (stationsError) {
      console.log('❌ DB stations API failed, trying locations endpoint');
    }

    // Final fallback to general locations endpoint
    const locationResponse = await fetch(
      `https://v5.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=8&stops=true&addresses=false&poi=false&fuzzy=true&language=de`,
      {
        headers: {
          'User-Agent': 'MdB-App/1.0',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!locationResponse.ok) {
      throw new Error(`Location search failed: ${locationResponse.status}`);
    }

    const locationsData = await locationResponse.json();
    
    // Filter and format results to only include train stations
    const trainStations = (locationsData || [])
      .filter((location: any) => 
        location.type === 'stop' && 
        location.products && 
        (location.products.nationalExpress || 
         location.products.national || 
         location.products.regionalExp || 
         location.products.regional)
      )
      .map((station: any) => ({
        id: station.id,
        name: station.name,
        type: 'station',
        location: station.location,
        products: station.products,
      }));

    console.log(`📍 Locations API found ${trainStations.length} results for "${query}"`);
    return NextResponse.json(trainStations);

  } catch (error) {
    console.error('❌ All station search methods failed:', error);
    return NextResponse.json({ error: 'Station search failed' }, { status: 500 });
  }
} 