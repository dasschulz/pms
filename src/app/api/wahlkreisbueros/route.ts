import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { Wahlkreisbuero, WahlkreisbueroFormData, GeocodeResult } from '@/types/wahlkreisbuero';

// GET - Fetch all wahlkreisbueros for current user or all if public
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const searchParams = request.nextUrl.searchParams;
    const includeRelations = searchParams.get('include') === 'relations';
    const publicView = searchParams.get('public') === 'true';

    let query = supabaseAdmin
      .from('wahlkreisbueros')
      .select(`
        *
        ${includeRelations ? `,
        mitarbeiter:wahlkreisbuero_mitarbeiter(*),
        oeffnungszeiten:wahlkreisbuero_oeffnungszeiten(*),
        sprechstunden:wahlkreisbuero_sprechstunden(*),
        beratungen:wahlkreisbuero_beratungen(*)
        ` : ''}
      `);

    if (!publicView) {
      if (!token || !token.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const userId = token.id as string;
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Wahlkreisbueros API] Error fetching wahlkreisbueros:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Wahlkreisbueros API] Found', data?.length || 0, 'wahlkreisbueros');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Wahlkreisbueros API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to geocode address
async function geocodeAddress(strasse: string, hausnummer: string, plz: string, ort: string): Promise<GeocodeResult> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET}`, // Use server auth
      },
      body: JSON.stringify({ strasse, hausnummer, plz, ort }),
    });

    if (!response.ok) {
      console.warn('[Wahlkreisbueros API] Geocoding failed:', response.status);
      return { latitude: null, longitude: null, success: false, message: 'Geocoding service unavailable' };
    }

    const result: GeocodeResult = await response.json();
    return result;
  } catch (error) {
    console.warn('[Wahlkreisbueros API] Geocoding error:', error);
    return { latitude: null, longitude: null, success: false, message: 'Geocoding failed' };
  }
}

// POST - Create new wahlkreisbuero
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      console.log('[Wahlkreisbueros API] Unauthorized: No valid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    console.log('[Wahlkreisbueros API] Creating wahlkreisbuero for user:', userId);
    
    const formData = await request.json() as WahlkreisbueroFormData;
    console.log('[Wahlkreisbueros API] Form data received:', formData);

    // Validate required fields
    if (!formData.name || !formData.strasse || !formData.hausnummer || !formData.plz || !formData.ort) {
      console.log('[Wahlkreisbueros API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Attempt to geocode the address
    console.log('[Wahlkreisbueros API] Attempting to geocode address');
    const geocodeResult = await geocodeAddress(formData.strasse, formData.hausnummer, formData.plz, formData.ort);
    
    if (geocodeResult.success) {
      console.log('[Wahlkreisbueros API] Successfully geocoded address:', geocodeResult);
    } else {
      console.warn('[Wahlkreisbueros API] Geocoding failed:', geocodeResult.message);
    }

    const wahlkreisbueroData = {
      user_id: userId,
      name: formData.name,
      strasse: formData.strasse,
      hausnummer: formData.hausnummer,
      plz: formData.plz,
      ort: formData.ort,
      barrierefreiheit: formData.barrierefreiheit || false,
      photo_url: (formData as any).photo_url || null,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
    };

    console.log('[Wahlkreisbueros API] Inserting data:', wahlkreisbueroData);

    const { data, error } = await supabaseAdmin
      .from('wahlkreisbueros')
      .insert([wahlkreisbueroData])
      .select()
      .single();

    if (error) {
      console.error('[Wahlkreisbueros API] Error creating wahlkreisbuero:', error);
      console.error('[Wahlkreisbueros API] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Wahlkreisbueros API] Successfully created wahlkreisbuero:', data);
    return NextResponse.json({ 
      data,
      geocoding: {
        success: geocodeResult.success,
        message: geocodeResult.message
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Wahlkreisbueros API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 