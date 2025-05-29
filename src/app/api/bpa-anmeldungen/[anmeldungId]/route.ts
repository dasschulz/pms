import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

interface UpdateAnmeldungBody {
  status?: string;           // e.g., 'Neu', 'Abgeschlossen', 'Terminiert', 'Eingegangen'
  statusTeilnahme?: string; // e.g., 'Abgesagt', 'Bestätigt', 'Nachrücker'
  // Add any other updatable fields for an application
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ anmeldungId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string; // Supabase UUID

  const { anmeldungId } = await params;
  if (!anmeldungId) {
    return NextResponse.json({ error: 'Missing anmeldungId parameter' }, { status: 400 });
  }

  console.log('BPA Application Update API: Updating application:', anmeldungId, 'for user:', userId);

  try {
    // Permission check:
    // 1. Fetch the bpa_formular record (application)
    // 2. Get its linked fahrt_id
    // 3. Fetch the bpa_fahrten record using that ID
    // 4. Check user_id of the bpa_fahrten against current user
    
    const { data: applicationRecord, error: appError } = await supabase
      .from('bpa_formular')
      .select('id, fahrt_id')
      .eq('id', anmeldungId)
      .single();

    if (appError || !applicationRecord) {
      console.log('BPA Application Update API: Application not found:', anmeldungId, appError?.message);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!applicationRecord.fahrt_id) {
      console.log('BPA Application Update API: Application not linked to trip:', anmeldungId);
      return NextResponse.json({ error: 'Application is not linked to a BPA trip' }, { status: 400 });
    }

    // Verify trip ownership
    const { data: fahrtRecord, error: fahrtError } = await supabase
      .from('bpa_fahrten')
      .select('id, user_id')
      .eq('id', applicationRecord.fahrt_id)
      .single();

    if (fahrtError || !fahrtRecord) {
      console.log('BPA Application Update API: Associated trip not found:', applicationRecord.fahrt_id, fahrtError?.message);
      return NextResponse.json({ error: 'Associated BPA Trip not found' }, { status: 404 });
    }

    if (fahrtRecord.user_id !== userId) {
      console.log('BPA Application Update API: Access denied - user does not own trip:', userId, 'vs', fahrtRecord.user_id);
      return NextResponse.json({ error: 'Forbidden. You do not own the BPA trip this application belongs to.' }, { status: 403 });
    }

    console.log('BPA Application Update API: Permission check passed');

    // If all checks pass, proceed to update
    const body: UpdateAnmeldungBody = await req.json();

    const fieldsToUpdate: any = {};
    if (body.status !== undefined) fieldsToUpdate['status'] = body.status;
    if (body.statusTeilnahme !== undefined) fieldsToUpdate['status_teilnahme'] = body.statusTeilnahme;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    console.log('BPA Application Update API: Updating fields:', fieldsToUpdate);

    const { data: updatedRecord, error: updateError } = await supabase
      .from('bpa_formular')
      .update(fieldsToUpdate)
      .eq('id', anmeldungId)
      .select()
      .single();

    if (updateError) {
      console.error('BPA Application Update API: Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    console.log('BPA Application Update API: Application updated successfully:', anmeldungId);

    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully', 
      recordId: updatedRecord.id,
      updatedFields: fieldsToUpdate // Return the updated fields
    });

  } catch (error) {
    console.error(`[API /bpa-anmeldungen/${anmeldungId} PUT] Supabase Error:`, error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
} 