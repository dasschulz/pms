import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'db-vendo-client';
import { profile as dbnavProfile } from 'db-vendo-client/p/dbnav/index.js';

// Create client
const client = createClient(dbnavProfile, 'MdB-App/1.0');

// Cache for station search results (5 minute TTL)
const stationSearchCache = new Map<string, { results: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean cache every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, cache] of stationSearchCache.entries()) {
    if (now - cache.timestamp > CACHE_TTL) {
      stationSearchCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = query.toLowerCase().trim();
  
  // Check cache first
  const cached = stationSearchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`🎯 Returning cached station results for "${query}" (${cached.results.length} results)`);
    return NextResponse.json(cached.results);
  }

  try {
    console.log(`🔍 Searching stations for "${query}"`);
    
    // Use db-vendo-client to search for locations
    const locations = await client.locations(query, {
      results: 12,
      stops: true,
      addresses: false,
      poi: false,
      language: 'de'
    });

    // Filter and format results to only include train stations
    const trainStations = locations
      .filter((location: any) => 
        location.type === 'stop' && 
        location.products && 
        (location.products.nationalExpress || 
         location.products.national || 
         location.products.regionalExp || 
         location.products.regional)
      )
      .slice(0, 8) // Limit to 8 results
      .map((station: any) => ({
        id: station.id,
        name: station.name,
        type: 'station',
        location: station.location,
        products: station.products,
        // Add weight based on available products for consistency
        weight: calculateStationWeight(station.products)
      }));

    // Cache the results
    stationSearchCache.set(cacheKey, {
      results: trainStations,
      timestamp: Date.now()
    });

    console.log(`✅ Found ${trainStations.length} train stations for "${query}"`);
    return NextResponse.json(trainStations);

  } catch (error) {
    console.error('❌ Station search failed:', error);
    
    // Return empty array instead of error to maintain UI functionality
    return NextResponse.json([]);
  }
}

// Helper function to calculate station weight based on available products
function calculateStationWeight(products: any): number {
  let weight = 0;
  
  if (products.nationalExpress) weight += 1000;
  if (products.national) weight += 500;
  if (products.regionalExp) weight += 200;
  if (products.regional) weight += 100;
  if (products.suburban) weight += 50;
  if (products.bus) weight += 10;
  if (products.taxi) weight += 5;
  
  return weight;
} 