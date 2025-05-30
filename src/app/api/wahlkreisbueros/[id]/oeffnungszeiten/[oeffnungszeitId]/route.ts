import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update opening hours
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; oeffnungszeitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, oeffnungszeitId } = await params;
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

    // Check for existing entry for this weekday (excluding current entry)
    const { data: existing } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .select('id')
      .eq('wahlkreisbuero_id', id)
      .eq('wochentag', wochentag)
      .neq('id', oeffnungszeitId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Öffnungszeiten für diesen Wochentag bereits vorhanden' }, { status: 409 });
    }

    // Update the opening hours
    const { data, error } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .update({
        wochentag,
        von_zeit: geschlossen ? null : von_zeit,
        bis_zeit: geschlossen ? null : bis_zeit,
        geschlossen: !!geschlossen
      })
      .eq('id', oeffnungszeitId)
      .eq('wahlkreisbuero_id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Öffnungszeiten' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Öffnungszeiten nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete opening hours
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; oeffnungszeitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, oeffnungszeitId } = await params;

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

    // Delete the opening hours
    const { error } = await supabase
      .from('wahlkreisbuero_oeffnungszeiten')
      .delete()
      .eq('id', oeffnungszeitId)
      .eq('wahlkreisbuero_id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Löschen der Öffnungszeiten' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 