import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // Supabase UUID of the MdB from users table

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  console.log('[BPA Public Active Trips] Fetching active trips for user:', userId);

  try {
    // Verify that the user exists
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('[BPA Public Active Trips] User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[BPA Public Active Trips] User verified, fetching active trips');

    // Fetch active trips for the user where applications are open
    const { data: records, error } = await supabase
      .from('bpa_fahrten')
      .select('id, fahrt_datum_von, fahrt_datum_bis, anmeldefrist, zielort, beschreibung, status_fahrt, aktiv')
      .eq('user_id', userId)
      .eq('status_fahrt', 'Anmeldung offen')
      .eq('aktiv', true)
      .order('fahrt_datum_von', { ascending: true });

    if (error) {
      console.error('[BPA Public Active Trips] Error fetching active trips from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch active BPA trips' }, { status: 500 });
    }

    console.log('[BPA Public Active Trips] Found', records?.length || 0, 'active trips');

    // Transform Supabase records to match expected frontend format
    const activeTrips = records?.map(record => ({
      id: record.id, // Use Supabase UUID
      name: `Fahrt nach ${record.zielort || 'Berlin'} (ab ${record.fahrt_datum_von || 'N/A'})`,
      startDate: record.fahrt_datum_von,
      endDate: record.fahrt_datum_bis,
      anmeldefrist: record.anmeldefrist,
      fahrtDatumVon: record.fahrt_datum_von,
      fahrtDatumBis: record.fahrt_datum_bis,
      zielort: record.zielort,
      beschreibung: record.beschreibung,
      aktiv: record.aktiv === true,
    })) || [];

    return NextResponse.json({ activeTrips });

  } catch (error) {
    console.error('[API /bpa-public/active-trips GET] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to fetch active BPA trips' }, { status: 500 });
  }
} 