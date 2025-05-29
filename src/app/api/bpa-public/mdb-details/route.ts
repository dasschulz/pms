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
  const lastName = searchParams.get('lastName');

  if (!lastName) {
    return NextResponse.json({ error: 'Missing lastName parameter' }, { status: 400 });
  }

  console.log('[BPA Public MdB Details] Searching for MdB with lastName:', lastName);

  try {
    // Search for users where the name contains the lastName (case-insensitive)
    // Only select PUBLIC, non-sensitive information needed for BPA forms
    const { data: records, error } = await supabaseAdmin
      .from('users')
      .select('id, name, wahlkreis') // Only public info - no email, phone, address, etc.
      .ilike('name', `%${lastName}%`)
      .limit(5);

    console.log('[BPA Public MdB Details] Search query: name ILIKE %' + lastName + '%');
    console.log('[BPA Public MdB Details] Found', records?.length || 0, 'MdB(s) matching lastName:', lastName);

    if (error) {
      console.error('[BPA Public MdB Details] Error searching for MdB:', error);
      return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
    }

    if (!records || records.length === 0) {
      console.log('[BPA Public MdB Details] No MdB found with lastName:', lastName);
      return NextResponse.json({ 
        error: 'MdB not found'
      }, { status: 404 });
    }

    // If multiple MdBs are found with a similar last name, return the first one
    const mdb = records[0];

    return NextResponse.json({
      id: mdb.id, // Supabase UUID for linking
      name: mdb.name,
      wahlkreis: mdb.wahlkreis,
    });

  } catch (error) {
    console.error('[API bpa-public/mdb-details] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
  }
} 