import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      titel,
      vorname,
      nachname,
      fachbereich,
      institution,
      ort,
      email,
      telefon,
      verfuegbar_fuer,
      zustimmung_datenspeicherung,
      zustimmung_kontakt_andere_mdb,
      parteimitglied,
    } = body;

    // Validation
    if (!vorname || !nachname || !fachbereich || !institution || !verfuegbar_fuer || !zustimmung_datenspeicherung) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(verfuegbar_fuer) || verfuegbar_fuer.length === 0) {
      return NextResponse.json({ error: 'verfuegbar_fuer must be a non-empty array' }, { status: 400 });
    }

    if (!Array.isArray(fachbereich) || fachbereich.length === 0) {
      return NextResponse.json({ error: 'fachbereich must be a non-empty array' }, { status: 400 });
    }

    // Check if referent exists and user has permission to edit
    const { data: existingReferent, error: fetchError } = await supabase
      .from('referenten')
      .select('angelegt_von')
      .eq('id', id)
      .single();

    if (fetchError || !existingReferent) {
      return NextResponse.json({ error: 'Referent not found' }, { status: 404 });
    }

    // Ensure user exists in users table for foreign key constraint
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        // User doesn't exist in users table, create it
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            name: session.user.name || session.user.email,
            email: session.user.email,
          });
      }
    } catch (error) {
      console.log('User validation failed:', error);
    }

    // Allow editing by the creator or any authenticated user (per requirements)
    // In a production environment, you might want to restrict this further

    const { data, error } = await supabase
      .from('referenten')
      .update({
        titel: titel || null,
        vorname,
        nachname,
        fachbereich,
        institution,
        ort: ort || null,
        email: email || null,
        telefon: telefon || null,
        verfuegbar_fuer,
        zustimmung_datenspeicherung,
        zustimmung_kontakt_andere_mdb: zustimmung_kontakt_andere_mdb || false,
        parteimitglied: parteimitglied || false,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating referent:', error);
      return NextResponse.json({ error: 'Error updating referent' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PUT /api/referentenpool/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if referent exists and user has permission to delete
    const { data: existingReferent, error: fetchError } = await supabase
      .from('referenten')
      .select('angelegt_von')
      .eq('id', id)
      .single();

    if (fetchError || !existingReferent) {
      return NextResponse.json({ error: 'Referent not found' }, { status: 404 });
    }

    // Ensure user exists in users table for foreign key constraint
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        // User doesn't exist in users table, create it
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            name: session.user.name || session.user.email,
            email: session.user.email,
          });
      }
    } catch (error) {
      console.log('User validation failed:', error);
    }

    // Allow deletion by the creator or any authenticated user (per requirements)
    // In a production environment, you might want to restrict this further

    const { error } = await supabase
      .from('referenten')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting referent:', error);
      return NextResponse.json({ error: 'Error deleting referent' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Referent deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/referentenpool/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 