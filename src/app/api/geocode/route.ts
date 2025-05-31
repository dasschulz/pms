import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for server-to-server auth or user token
    const authHeader = request.headers.get('authorization');
    const isServerCall = authHeader?.startsWith('Bearer') && authHeader.includes(process.env.NEXTAUTH_SECRET || '');
    
    if (!isServerCall) {
      // For user requests, require authentication
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (!token || !token.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { strasse, hausnummer, plz, ort } = await request.json();

    if (!strasse || !hausnummer || !plz || !ort) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    // Build address string for geocoding
    const address = `${strasse} ${hausnummer}, ${plz} ${ort}, Deutschland`;
    
    // Use OpenStreetMap Nominatim API (free alternative to Google Maps)
    const encodedAddress = encodeURIComponent(address);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodedAddress}`;
    
    console.log('[Geocoding API] Geocoding address:', address);
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MdB-App/1.0 (https://your-domain.com)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('[Geocoding API] Nominatim API error:', response.status, response.statusText);
      return NextResponse.json(
        { 
          latitude: null, 
          longitude: null, 
          success: false, 
          message: 'Geocoding service temporarily unavailable' 
        },
        { status: 200 } // Return 200 but with failure flag
      );
    }

    const results: NominatimResult[] = await response.json();
    
    if (results.length === 0) {
      console.log('[Geocoding API] No results found for address:', address);
      return NextResponse.json({
        latitude: null,
        longitude: null,
        success: false,
        message: 'Address not found'
      });
    }

    const result = results[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    console.log('[Geocoding API] Successfully geocoded:', { latitude, longitude, display_name: result.display_name });

    return NextResponse.json({
      latitude,
      longitude,
      success: true,
      message: 'Address successfully geocoded'
    });

  } catch (error) {
    console.error('[Geocoding API] Unexpected error:', error);
    return NextResponse.json(
      { 
        latitude: null, 
        longitude: null, 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 