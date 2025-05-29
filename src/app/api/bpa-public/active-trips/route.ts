import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS for this specific public use case
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // Supabase UUID of the MdB from users table

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  console.log('[BPA Public Active Trips] Fetching active trips for user:', userId);

  try {
    // Verify that the user exists - only select public info
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('[BPA Public Active Trips] User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[BPA Public Active Trips] User verified, fetching active trips');

    // Get active trips for this user (status = 'Anmeldung offen')
    const { data: tripsData, error: tripsError } = await supabaseAdmin
      .from('bpa_fahrten')
      .select('*')
      .eq('user_id', userId)
      .eq('status_fahrt', 'Anmeldung offen')
      .order('fahrt_datum_von', { ascending: true });

    if (tripsError) {
      console.error('[BPA Public Active Trips] Error fetching active trips from Supabase:', tripsError);
      return NextResponse.json({ error: 'Failed to fetch active BPA trips' }, { status: 500 });
    }

    console.log('[BPA Public Active Trips] Found', tripsData?.length || 0, 'active trips');

    // Transform Supabase records to match expected frontend format
    const activeTrips = tripsData?.map(record => ({
      id: record.id, // Use Supabase UUID
      name: `Fahrt nach ${record.zielort || 'Berlin'} (ab ${record.fahrt_datum_von || 'N/A'})`,
      fahrtDatumVon: record.fahrt_datum_von,
      fahrtDatumBis: record.fahrt_datum_bis,
      anmeldefrist: record.anmeldefrist,
      zielort: record.zielort,
      beschreibung: record.beschreibung,
      statusFahrt: record.status_fahrt,
    })) || [];

    return NextResponse.json({ activeTrips });

  } catch (error) {
    console.error('[API /bpa-public/active-trips GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch active BPA trips' }, { status: 500 });
  }
} 