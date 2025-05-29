import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS for this specific public use case
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
  }

  console.log('[Tour Form MdB Details] Validating token:', token);

  try {
    // First, validate the token and get the associated user_id
    const { data: linkRecords, error: linkError } = await supabaseAdmin
      .from('touranfragen_links')
      .select('user_id')
      .eq('token', token)
      .eq('active', true)
      .limit(1);

    console.log('[Tour Form MdB Details] Token validation query complete');

    if (linkError) {
      console.error('[Tour Form MdB Details] Error validating token:', linkError);
      return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
    }

    if (!linkRecords || linkRecords.length === 0) {
      console.log('[Tour Form MdB Details] Invalid or expired token:', token);
      return NextResponse.json({ 
        error: 'Invalid or expired token'
      }, { status: 404 });
    }

    const linkRecord = linkRecords[0];
    const userId = linkRecord.user_id;

    console.log('[Tour Form MdB Details] Token valid, fetching MdB details for user ID:', userId);

    // Now fetch the MdB details using the user_id
    // Only select PUBLIC, non-sensitive information needed for the tour form
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, wahlkreis') // Only public info needed for form display
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[Tour Form MdB Details] Error fetching MdB details:', userError);
      return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
    }

    if (!userRecord) {
      console.log('[Tour Form MdB Details] No MdB found with user ID:', userId);
      return NextResponse.json({ 
        error: 'MdB not found'
      }, { status: 404 });
    }

    // Extract first name from full name
    const nameParts = userRecord.name.split(' ');
    const firstName = nameParts[0] || '';

    console.log('[Tour Form MdB Details] Successfully found MdB:', userRecord.name);

    return NextResponse.json({
      userId: userRecord.id,
      userIdNumber: '', // Not needed for tour forms
      name: userRecord.name,
      firstName: firstName,
      email: userRecord.email,
      wahlkreis: userRecord.wahlkreis,
      linkRecordId: token, // Use token as reference
    });

  } catch (error) {
    console.error('[API tour-form/mdb-details] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
  }
} 