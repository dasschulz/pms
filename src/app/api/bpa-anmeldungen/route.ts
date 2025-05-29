import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) { // MdBs should be logged in to see applications
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // Supabase UUID

  const { searchParams } = new URL(req.url);
  const fahrtId = searchParams.get('fahrtId'); // Supabase UUID of the BPA trip

  if (!fahrtId) {
    return NextResponse.json({ error: 'Missing fahrtId parameter' }, { status: 400 });
  }

  console.log('BPA Applications API: Fetching applications for trip:', fahrtId, 'user:', userId);

  // Permission check: ensure the logged-in MdB owns the trip before showing applications
  try {
    // First verify trip ownership
    const { data: fahrtRecord, error: fahrtError } = await supabase
      .from('bpa_fahrten')
      .select('id, user_id')
      .eq('id', fahrtId)
      .eq('user_id', userId) // Ensure user owns this trip
      .single();

    if (fahrtError || !fahrtRecord) {
      console.log('BPA Applications API: Trip not found or access denied:', fahrtId, fahrtError?.message);
      return NextResponse.json({ error: 'Forbidden. You do not own the BPA trip associated with this fahrtId.' }, { status: 403 });
    }

    console.log('BPA Applications API: Trip ownership verified, fetching applications');

    // Fetch applications for this trip
    const { data: records, error: recordsError } = await supabase
      .from('bpa_formular')
      .select('*')
      .eq('fahrt_id', fahrtId)
      .order('created_at', { ascending: true });

    if (recordsError) {
      console.error('BPA Applications API: Error fetching applications:', recordsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    console.log('BPA Applications API: Found', records?.length || 0, 'applications');

    // Transform Supabase records to match expected format
    const applications = records?.map(record => ({
      id: record.id, // Use Supabase UUID for frontend operations
      vorname: record.vorname,
      nachname: record.nachname,
      geburtsdatum: record.geburtsdatum,
      email: record.email,
      anschrift: record.anschrift,
      postleitzahl: record.postleitzahl,
      ort: record.ort,
      parteimitglied: record.parteimitglied,
      zustieg: record.zustieg,
      essenspraeferenz: record.essenspraeferenzen,
      status: record.status,
      statusTeilnahme: record.status_teilnahme,
      telefonnummer: record.telefonnummer,
      geburtsort: record.geburtsort,
      themen: record.themen,
      teilnahme5J: record.teilnahme_5j,
      einzelzimmer: record.einzelzimmer,
      created: record.created_at,
    })) || [];

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('[API /bpa-anmeldungen GET] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
} 