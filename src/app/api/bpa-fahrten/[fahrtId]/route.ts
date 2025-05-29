import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

interface UpdateBpaFahrtBody {
  fahrtDatumVon?: string;
  fahrtDatumBis?: string;
  zielort?: string;
  hotelName?: string;
  hotelAdresse?: string;
  kontingentMax?: number;
  statusFahrt?: string;
  anmeldefrist?: string;
  beschreibung?: string;
  zustaiegsorteConfig?: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ fahrtId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // This is now the Supabase UUID

  try {
    const { fahrtId } = await params;
    console.log('BPA Fahrt Details API: Fetching trip:', fahrtId, 'for user:', userId);

    // Fetch trip from Supabase and verify ownership
    const { data: fahrtRecord, error } = await supabase
      .from('bpa_fahrten')
      .select('*')
      .eq('id', fahrtId)
      .eq('user_id', userId) // Ensure user owns this trip
      .single();

    if (error || !fahrtRecord) {
      console.log('BPA Fahrt Details API: Trip not found or access denied:', fahrtId, error?.message);
      return NextResponse.json({ error: 'BPA trip not found or access denied' }, { status: 404 });
    }

    console.log('BPA Fahrt Details API: Found trip:', fahrtRecord.id);

    // Transform for frontend
    const fahrt = {
      id: fahrtRecord.id,
      fahrtDatumVon: fahrtRecord.fahrt_datum_von,
      fahrtDatumBis: fahrtRecord.fahrt_datum_bis,
      zielort: fahrtRecord.zielort,
      hotelName: fahrtRecord.hotel_name,
      hotelAdresse: fahrtRecord.hotel_adresse,
      kontingentMax: fahrtRecord.kontingent_max,
      // These calculated fields would need to be computed from bpa_formular table
      aktuelleAnmeldungen: 0, // TODO: Add count query from bpa_formular
      bestaetigteAnmeldungen: 0, // TODO: Add count query from bpa_formular
      statusFahrt: fahrtRecord.status_fahrt,
      anmeldefrist: fahrtRecord.anmeldefrist,
      beschreibung: fahrtRecord.beschreibung,
      zustaiegsorteConfig: fahrtRecord.zustiegsorte_config,
    };

    return NextResponse.json({ fahrt: fahrt });

  } catch (error) {
    console.error(`[API /bpa-fahrten/${params} GET] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch BPA trip details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ fahrtId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // This is now the Supabase UUID

  try {
    const { fahrtId } = await params;
    console.log('BPA Fahrt Update API: Updating trip:', fahrtId, 'for user:', userId);

    // First verify that the trip exists and belongs to the user
    const { data: existingTrip, error: fetchError } = await supabase
      .from('bpa_fahrten')
      .select('*')
      .eq('id', fahrtId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTrip) {
      console.log('BPA Fahrt Update API: Trip not found or access denied:', fahrtId, fetchError?.message);
      return NextResponse.json({ error: 'BPA trip not found or access denied' }, { status: 404 });
    }

    const body: UpdateBpaFahrtBody = await req.json();

    // Build update object with only provided fields
    const updateFields: any = {};
    if (body.fahrtDatumVon !== undefined) updateFields.fahrt_datum_von = body.fahrtDatumVon;
    if (body.fahrtDatumBis !== undefined) updateFields.fahrt_datum_bis = body.fahrtDatumBis;
    if (body.zielort !== undefined) updateFields.zielort = body.zielort;
    if (body.hotelName !== undefined) updateFields.hotel_name = body.hotelName;
    if (body.hotelAdresse !== undefined) updateFields.hotel_adresse = body.hotelAdresse;
    if (body.kontingentMax !== undefined) updateFields.kontingent_max = body.kontingentMax;
    if (body.statusFahrt !== undefined) updateFields.status_fahrt = body.statusFahrt;
    if (body.anmeldefrist !== undefined) updateFields.anmeldefrist = body.anmeldefrist;
    if (body.beschreibung !== undefined) updateFields.beschreibung = body.beschreibung;
    if (body.zustaiegsorteConfig !== undefined) updateFields.zustiegsorte_config = body.zustaiegsorteConfig;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    console.log('BPA Fahrt Update API: Updating fields:', updateFields);

    // Update the trip in Supabase
    const { error: updateError } = await supabase
      .from('bpa_fahrten')
      .update(updateFields)
      .eq('id', fahrtId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('BPA Fahrt Update API: Error updating trip:', updateError);
      return NextResponse.json({ error: 'Failed to update BPA trip' }, { status: 500 });
    }

    console.log('BPA Fahrt Update API: Trip updated successfully:', fahrtId);

    return NextResponse.json({ 
      success: true, 
      message: 'BPA trip updated successfully', 
      recordId: fahrtId 
    });

  } catch (error) {
    console.error(`[API /bpa-fahrten/${params} PUT] Supabase Error:`, error);
    return NextResponse.json({ error: 'Failed to update BPA trip' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ fahrtId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // This is now the Supabase UUID

  try {
    const { fahrtId } = await params;
    console.log('BPA Fahrt Delete API: Deleting trip:', fahrtId, 'for user:', userId);

    // First verify that the trip exists and belongs to the user
    const { data: existingTrip, error: fetchError } = await supabase
      .from('bpa_fahrten')
      .select('*')
      .eq('id', fahrtId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTrip) {
      console.log('BPA Fahrt Delete API: Trip not found or access denied:', fahrtId, fetchError?.message);
      return NextResponse.json({ error: 'BPA trip not found or access denied' }, { status: 404 });
    }

    // Check if there are any applications for this trip
    const { data: applications, error: applicationsError } = await supabase
      .from('bpa_formular')
      .select('id')
      .eq('fahrt_id', fahrtId);

    if (applicationsError) {
      console.error('BPA Fahrt Delete API: Error checking applications:', applicationsError);
      return NextResponse.json({ error: 'Failed to check trip applications' }, { status: 500 });
    }

    if (applications && applications.length > 0) {
      return NextResponse.json({ 
        error: 'Diese Fahrt kann nicht gelöscht werden, da bereits Anmeldungen vorliegen. Setzen Sie den Status stattdessen auf "Storniert".' 
      }, { status: 400 });
    }

    // Delete the trip from Supabase
    const { error: deleteError } = await supabase
      .from('bpa_fahrten')
      .delete()
      .eq('id', fahrtId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('BPA Fahrt Delete API: Error deleting trip:', deleteError);
      return NextResponse.json({ error: 'Failed to delete BPA trip' }, { status: 500 });
    }

    console.log('BPA Fahrt Delete API: Trip deleted successfully:', fahrtId);

    return NextResponse.json({ 
      success: true, 
      message: 'BPA trip deleted successfully', 
      recordId: fahrtId 
    });

  } catch (error) {
    console.error(`[API /bpa-fahrten/${params} DELETE] Supabase Error:`, error);
    return NextResponse.json({ error: 'Failed to delete BPA trip' }, { status: 500 });
  }
} 