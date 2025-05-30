import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mitarbeiterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, mitarbeiterId } = await params;
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

    // Update the staff member
    const { data, error } = await supabase
      .from('wahlkreisbuero_mitarbeiter')
      .update({
        name: name.trim(),
        funktion: funktion || 'Mitarbeiter',
        telefon: telefon || null,
        email: email || null
      })
      .eq('id', mitarbeiterId)
      .eq('wahlkreisbuero_id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren des Mitarbeiters' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mitarbeiterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, mitarbeiterId } = await params;

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

    // Delete the staff member
    const { error } = await supabase
      .from('wahlkreisbuero_mitarbeiter')
      .delete()
      .eq('id', mitarbeiterId)
      .eq('wahlkreisbuero_id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Fehler beim Löschen des Mitarbeiters' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 