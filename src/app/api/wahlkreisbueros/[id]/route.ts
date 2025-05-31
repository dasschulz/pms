import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { WahlkreisbueroFormData } from '@/types/wahlkreisbuero';

// GET - Fetch single wahlkreisbuero
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
    
    const { data, error } = await supabaseAdmin
      .from('wahlkreisbueros')
      .select(`
        *,
        oeffnungszeiten:wahlkreisbuero_oeffnungszeiten(*),
        sprechstunden:wahlkreisbuero_sprechstunden(*),
        beratungen:wahlkreisbuero_beratungen(*)
      `)
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching wahlkreisbuero:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Wahlkreisbuero not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT - Update wahlkreisbuero
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const formData = await request.json() as WahlkreisbueroFormData;

    // Validate required fields
    if (!formData.name || !formData.strasse || !formData.hausnummer || !formData.plz || !formData.ort) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData = {
      name: formData.name,
      strasse: formData.strasse,
      hausnummer: formData.hausnummer,
      plz: formData.plz,
      ort: formData.ort,
      barrierefreiheit: formData.barrierefreiheit || false,
      photo_url: (formData as any).photo_url || null,
    };

    const { data, error } = await supabaseAdmin
      .from('wahlkreisbueros')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating wahlkreisbuero:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Wahlkreisbuero not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete wahlkreisbuero
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;

    const { error } = await supabaseAdmin
      .from('wahlkreisbueros')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting wahlkreisbuero:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 