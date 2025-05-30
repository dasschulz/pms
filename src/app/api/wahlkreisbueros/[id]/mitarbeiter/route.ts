import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all staff for a wahlkreisbuero
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
      .from('wahlkreisbuero_mitarbeiter')
      .select('*')
      .eq('wahlkreisbuero_id', id)
      .order('name');

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

// POST - Create new staff member
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
    const { name, funktion, telefon, email } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
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

    const { data, error } = await supabase
      .from('wahlkreisbuero_mitarbeiter')
      .insert({
        wahlkreisbuero_id: id,
        name: name.trim(),
        funktion: funktion || 'Mitarbeiter',
        telefon: telefon || null,
        email: email || null
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Mitarbeiters' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 