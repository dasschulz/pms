import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all journalists with aggregated ratings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the journalist_cards view for aggregated data
    const { data: journalists, error } = await supabase
      .from('journalist_cards')
      .select('*')
      .order('nachname', { ascending: true });

    if (error) {
      console.error('Error fetching journalists:', error);
      return NextResponse.json({ error: 'Failed to fetch journalists' }, { status: 500 });
    }

    return NextResponse.json(journalists || []);
  } catch (error) {
    console.error('Error in GET /api/journalistenpool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new journalist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titel,
      vorname,
      nachname,
      haus,
      funktion,
      email,
      telefon,
      medium,
      ressort,
      zustaendig_fuer,
      land,
      region,
      schwerpunkt,
      themen,
      zustimmung_datenspeicherung
    } = body;

    // Validation
    if (!vorname || !nachname || !medium || !ressort || !zustaendig_fuer || !schwerpunkt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate conditional fields
    if (zustaendig_fuer === 'Landespolitik' && !land) {
      return NextResponse.json({ error: 'Land is required when Zuständig für is Landespolitik' }, { status: 400 });
    }

    if (zustaendig_fuer === 'Lokalpolitik' && !region) {
      return NextResponse.json({ error: 'Region is required when Zuständig für is Lokalpolitik' }, { status: 400 });
    }

    // Get user details for hinzugefuegt_von
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('vorname, nachname')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    const hinzugefuegt_von = userData ? `${userData.vorname || ''} ${userData.nachname || ''}`.trim() || 'Unbekannt' : 'Unbekannt';

    const { data: journalist, error } = await supabase
      .from('journalisten')
      .insert({
        titel,
        vorname,
        nachname,
        haus,
        funktion,
        email,
        telefon,
        medium,
        ressort,
        zustaendig_fuer,
        land: zustaendig_fuer === 'Landespolitik' ? land : null,
        region: zustaendig_fuer === 'Lokalpolitik' ? region : null,
        schwerpunkt,
        themen: themen || [],
        zustimmung_datenspeicherung: zustimmung_datenspeicherung || false,
        angelegt_von: session.user.id,
        hinzugefuegt_von
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating journalist:', error);
      return NextResponse.json({ error: 'Failed to create journalist' }, { status: 500 });
    }

    return NextResponse.json(journalist);
  } catch (error) {
    console.error('Error in POST /api/journalistenpool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 