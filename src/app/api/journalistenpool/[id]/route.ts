import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single journalist with details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: journalist, error } = await supabase
      .from('journalist_cards')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching journalist:', error);
      return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
    }

    return NextResponse.json(journalist);
  } catch (error) {
    console.error('Error in GET /api/journalistenpool/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update journalist
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user owns this journalist record
    const { data: existingJournalist } = await supabase
      .from('journalisten')
      .select('angelegt_von')
      .eq('id', params.id)
      .single();

    if (!existingJournalist || existingJournalist.angelegt_von !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this journalist' }, { status: 403 });
    }

    const { data: journalist, error } = await supabase
      .from('journalisten')
      .update({
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
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating journalist:', error);
      return NextResponse.json({ error: 'Failed to update journalist' }, { status: 500 });
    }

    return NextResponse.json(journalist);
  } catch (error) {
    console.error('Error in PUT /api/journalistenpool/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete journalist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this journalist record
    const { data: existingJournalist } = await supabase
      .from('journalisten')
      .select('angelegt_von')
      .eq('id', params.id)
      .single();

    if (!existingJournalist || existingJournalist.angelegt_von !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this journalist' }, { status: 403 });
    }

    const { error } = await supabase
      .from('journalisten')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting journalist:', error);
      return NextResponse.json({ error: 'Failed to delete journalist' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Journalist deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/journalistenpool/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 