import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { Wahlkreisbuero, WahlkreisbueroFormData } from '@/types/wahlkreisbuero';

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

    // TODO: Implement geocoding for coordinates
    const wahlkreisbueroData = {
      user_id: userId,
      name: formData.name,
      strasse: formData.strasse,
      hausnummer: formData.hausnummer,
      plz: formData.plz,
      ort: formData.ort,
      telefon: formData.telefon || null,
      email: formData.email || null,
      barrierefreiheit: formData.barrierefreiheit || false,
      photo_url: (formData as any).photo_url || null,
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
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('[Wahlkreisbueros API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 