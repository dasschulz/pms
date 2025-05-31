import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { BeratungsFormData } from '@/types/wahlkreisbuero';

// GET - Fetch all beratungen for a wahlkreisbuero
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const wahlkreisbueroId = params.id;

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

    // Fetch beratungen
    const { data, error } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .select('*')
      .eq('wahlkreisbuero_id', wahlkreisbueroId)
      .order('typ');

    if (error) {
      console.error('[Beratungen API] Error fetching beratungen:', error);
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

// POST - Create new beratung
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const wahlkreisbueroId = params.id;

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

    // Check if this consultation type already exists for this office
    const { data: existing } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .select('id')
      .eq('wahlkreisbuero_id', wahlkreisbueroId)
      .eq('typ', formData.typ)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This consultation type already exists for this office' },
        { status: 409 }
      );
    }

    const beratungData = {
      wahlkreisbuero_id: wahlkreisbueroId,
      typ: formData.typ,
      anbieter: formData.anbieter,
      wochentag: formData.wochentag || null,
      von_zeit: formData.von_zeit || null,
      bis_zeit: formData.bis_zeit || null,
      beschreibung: formData.beschreibung || null
    };

    const { data, error } = await supabaseAdmin
      .from('wahlkreisbuero_beratungen')
      .insert([beratungData])
      .select()
      .single();

    if (error) {
      console.error('[Beratungen API] Error creating beratung:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('[Beratungen API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 