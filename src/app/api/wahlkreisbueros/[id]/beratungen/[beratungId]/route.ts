import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { BeratungsFormData } from '@/types/wahlkreisbuero';

// PUT - Update beratung
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; beratungId: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const wahlkreisbueroId = params.id;
    const beratungId = params.beratungId;

    // Verify ownership of the wahlkreisbuero
    const { data: wahlkreisbuero, error: wahlkreisbueroError } = await supabaseAdmin
      .from('wahlkreisbueros')
      .select('id, user_id')
      .eq('id', wahlkreisbueroId)
      .single();

    if (wahlkreisbueroError || !wahlkreisbuero) {
      return NextResponse.json({ error: 'Wahlkreisbüro not found' }, { status: 404 });
    }

    if (wahlkreisbuero.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify beratung exists and belongs to this wahlkreisbuero
    const { data: existingBeratung, error: beratungError } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .select('id, typ')
      .eq('id', beratungId)
      .eq('wahlkreisbuero_id', wahlkreisbueroId)
      .single();

    if (beratungError || !existingBeratung) {
      return NextResponse.json({ error: 'Beratung not found' }, { status: 404 });
    }

    const formData = await request.json() as BeratungsFormData;

    // Validate required fields
    if (!formData.typ || !formData.anbieter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate time fields if not by appointment
    if (formData.wochentag && (!formData.von_zeit || !formData.bis_zeit)) {
      return NextResponse.json(
        { error: 'Time fields required when day is specified' },
        { status: 400 }
      );
    }

    // Check if changing to a type that already exists (and it's not the same record)
    if (formData.typ !== existingBeratung.typ) {
      const { data: conflicting } = await supabaseAdmin
        .from('wahlkreisbuero_beratungen')
        .select('id')
        .eq('wahlkreisbuero_id', wahlkreisbueroId)
        .eq('typ', formData.typ)
        .neq('id', beratungId)
        .single();

      if (conflicting) {
        return NextResponse.json(
          { error: 'This consultation type already exists for this office' },
          { status: 409 }
        );
      }
    }

    const updateData = {
      typ: formData.typ,
      anbieter: formData.anbieter,
      wochentag: formData.wochentag || null,
      von_zeit: formData.von_zeit || null,
      bis_zeit: formData.bis_zeit || null,
      beschreibung: formData.beschreibung || null
    };

    const { data, error } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .update(updateData)
      .eq('id', beratungId)
      .select()
      .single();

    if (error) {
      console.error('[Beratungen API] Error updating beratung:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Beratungen API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete beratung
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; beratungId: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const wahlkreisbueroId = params.id;
    const beratungId = params.beratungId;

    // Verify ownership of the wahlkreisbuero
    const { data: wahlkreisbuero, error: wahlkreisbueroError } = await supabaseAdmin
      .from('wahlkreisbueros')
      .select('id, user_id')
      .eq('id', wahlkreisbueroId)
      .single();

    if (wahlkreisbueroError || !wahlkreisbuero) {
      return NextResponse.json({ error: 'Wahlkreisbüro not found' }, { status: 404 });
    }

    if (wahlkreisbuero.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete beratung
    const { error } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .delete()
      .eq('id', beratungId)
      .eq('wahlkreisbuero_id', wahlkreisbueroId);

    if (error) {
      console.error('[Beratungen API] Error deleting beratung:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Beratung deleted successfully' });
  } catch (error) {
    console.error('[Beratungen API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 