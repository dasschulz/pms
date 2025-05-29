import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

// --- GET all BPA_Fahrten for the logged-in MdB ---
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // This is now the Supabase UUID

  try {
    console.log('BPA Fahrten API: Fetching trips for user ID:', userId);

    // Query BPA trips from Supabase
    const { data: records, error } = await supabase
      .from('bpa_fahrten')
      .select('*')
      .eq('user_id', userId)
      .order('fahrt_datum_von', { ascending: false });

    if (error) {
      console.error('BPA Fahrten API: Error fetching trips from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch BPA trips' }, { status: 500 });
    }

    console.log('BPA Fahrten API: Found', records?.length || 0, 'trips');

    // Transform Supabase records to match expected frontend format
    const trips = records?.map(record => ({
      id: record.id, // Use Supabase UUID for frontend operations
      fahrtDatumVon: record.fahrt_datum_von,
      fahrtDatumBis: record.fahrt_datum_bis,
      zielort: record.zielort,
      hotelName: record.hotel_name,
      hotelAdresse: record.hotel_adresse,
      kontingentMax: record.kontingent_max,
      // These calculated fields would need to be computed from bpa_formular table
      aktuelleAnmeldungen: 0, // TODO: Add count query from bpa_formular
      bestaetigteAnmeldungen: 0, // TODO: Add count query from bpa_formular
      statusFahrt: record.status_fahrt,
      anmeldefrist: record.anmeldefrist,
      beschreibung: record.beschreibung,
      zustaiegsorteConfig: record.zustiegsorte_config,
    })) || [];

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('[API /bpa-fahrten GET] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to fetch BPA trips' }, { status: 500 });
  }
}

// --- POST a new BPA_Fahrt for the logged-in MdB ---
interface CreateBpaFahrtBody {
  fahrtDatumVon?: string;
  fahrtDatumBis?: string;
  zielort?: string;
  hotelName?: string;
  hotelAdresse?: string;
  kontingentMax?: number;
  statusFahrt?: string;
  anmeldefrist?: string;
  beschreibung?: string;
  zustaiegsorteConfig?: string;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // This is now the Supabase UUID

  try {
    console.log('BPA Fahrten API: Creating trip for user ID:', userId);

    const body: CreateBpaFahrtBody = await req.json();

    // Validate required fields
    if (!body.fahrtDatumVon) {
      return NextResponse.json({ error: 'Missing required fields (fahrtDatumVon)' }, { status: 400 });
    }
    
    // Prepare data for Supabase insertion
    const supabaseData = {
      user_id: userId,
      fahrt_datum_von: body.fahrtDatumVon,
      fahrt_datum_bis: body.fahrtDatumBis || null,
      zielort: body.zielort || null,
      hotel_name: body.hotelName || null,
      hotel_adresse: body.hotelAdresse || null,
      kontingent_max: body.kontingentMax || null,
      status_fahrt: body.statusFahrt || 'Planung',
      anmeldefrist: body.anmeldefrist || null,
      beschreibung: body.beschreibung || null,
      zustiegsorte_config: body.zustaiegsorteConfig || null,
    };

    console.log('BPA Fahrten API: Inserting trip data:', supabaseData);

    // Create trip in Supabase
    const { data: createdRecord, error } = await supabase
      .from('bpa_fahrten')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('BPA Fahrten API: Error creating trip:', error);
      return NextResponse.json({ error: 'Failed to create BPA trip' }, { status: 500 });
    }

    console.log('BPA Fahrten API: Trip created successfully:', createdRecord.id);

    return NextResponse.json({ 
      success: true, 
      message: 'BPA trip created successfully', 
      recordId: createdRecord.id 
    }, { status: 201 });

  } catch (error) {
    console.error('[API /bpa-fahrten POST] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to create BPA trip' }, { status: 500 });
  }
} 