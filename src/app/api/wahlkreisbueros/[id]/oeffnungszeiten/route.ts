import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all opening hours for a wahlkreisbuero
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .select('*')
      .eq('wahlkreisbuero_id', id)
      .order('wochentag');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new opening hours
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { wochentag, von_zeit, bis_zeit, geschlossen } = body;

    // Validate required fields
    if (wochentag === undefined || wochentag < 1 || wochentag > 7) {
      return NextResponse.json({ error: 'Gültiger Wochentag erforderlich (1-7)' }, { status: 400 });
    }

    if (!geschlossen && (!von_zeit || !bis_zeit)) {
      return NextResponse.json({ error: 'Öffnungs- und Schließzeiten sind erforderlich' }, { status: 400 });
    }

    if (!geschlossen && von_zeit >= bis_zeit) {
      return NextResponse.json({ error: 'Öffnungszeit muss vor Schließungszeit liegen' }, { status: 400 });
    }

    // Verify wahlkreisbuero ownership
    const { data: wahlkreisbuero, error: ownershipError } = await supabase
      .from('wahlkreisbueros')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (ownershipError || !wahlkreisbuero) {
      return NextResponse.json({ error: 'Wahlkreisbüro nicht gefunden' }, { status: 404 });
    }

    // Check for existing entry for this weekday
    const { data: existing } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .select('id')
      .eq('wahlkreisbuero_id', id)
      .eq('wochentag', wochentag)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Öffnungszeiten für diesen Wochentag bereits vorhanden' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .insert({
        wahlkreisbuero_id: id,
        wochentag,
        von_zeit: geschlossen ? null : von_zeit,
        bis_zeit: geschlossen ? null : bis_zeit,
        geschlossen: !!geschlossen
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Erstellen der Öffnungszeiten' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 