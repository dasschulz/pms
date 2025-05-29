import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // Supabase UUID

  try {
    console.log('[Touranfragen API] Fetching tour requests for user ID:', userId);

    // Query tour requests from Supabase for the authenticated user
    const { data: records, error } = await supabase
      .from('touranfragen')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Touranfragen API] Error fetching tour requests from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch tour requests' }, { status: 500 });
    }

    console.log('[Touranfragen API] Found', records?.length || 0, 'tour requests');

    // Transform Supabase records to match expected frontend format
    const tourRequests = records?.map(record => ({
      id: record.id, // Use Supabase UUID
      createdAt: record.created_at,
      kreisverband: record.kreisverband,
      landesverband: record.landesverband,
      kandidatName: record.kandidat_name,
      zeitraumVon: record.zeitraum_von,
      zeitraumBis: record.zeitraum_bis,
      themen: record.themen,
      video: record.video ? 'Ja' : 'Nein' as 'Ja' | 'Nein',
      ansprechpartner1Name: record.ansprechpartner_1_name,
      ansprechpartner1Phone: record.ansprechpartner_1_phone,
      ansprechpartner2Name: record.ansprechpartner_2_name,
      ansprechpartner2Phone: record.ansprechpartner_2_phone,
      programmvorschlag: record.programmvorschlag || 'möchte ich mit dem Büro klären' as 'füge ich an' | 'möchte ich mit dem Büro klären',
      status: record.status || 'Neu' as 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen',
    })) || [];

    return NextResponse.json({ requests: tourRequests });
  } catch (error) {
    console.error('[Touranfragen API] Supabase error fetching tour requests:', error);
    return NextResponse.json({ error: 'Failed to fetch tour requests' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // Supabase UUID

  try {
    const { id, status } = await req.json();
    
    console.log('[Touranfragen API] Updating status for record:', id, 'to:', status, 'for user:', userId);

    // First verify that the tour request belongs to the authenticated user
    const { data: existingRecord, error: fetchError } = await supabase
      .from('touranfragen')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingRecord) {
      console.log('[Touranfragen API] Tour request not found or access denied:', id, fetchError?.message);
      return NextResponse.json({ error: 'Tour request not found or access denied' }, { status: 404 });
    }

    // Update the status in Supabase
    const { data: updatedRecord, error: updateError } = await supabase
      .from('touranfragen')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('[Touranfragen API] Error updating tour request status:', updateError);
      return NextResponse.json({ error: 'Failed to update tour request' }, { status: 500 });
    }

    console.log('[Touranfragen API] Status updated successfully for record:', id);

    return NextResponse.json({ 
      success: true, 
      record: {
        id: updatedRecord.id,
        status: updatedRecord.status
      }
    });
  } catch (error) {
    console.error('[Touranfragen API] Supabase error updating tour request:', error);
    return NextResponse.json({ error: 'Failed to update tour request' }, { status: 500 });
  }
} 