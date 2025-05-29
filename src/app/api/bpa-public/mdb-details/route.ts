import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastName = searchParams.get('lastName');

  if (!lastName) {
    return NextResponse.json({ error: 'Missing lastName parameter' }, { status: 400 });
  }

  console.log('[BPA Public MdB Details] Searching for MdB with lastName:', lastName);

  try {
    // Search for users where the name contains the lastName (case-insensitive)
    // Using ilike for case-insensitive pattern matching
    const { data: records, error } = await supabase
      .from('users')
      .select('id, name, wahlkreis')
      .ilike('name', `%${lastName}%`)
      .limit(5); // Limit in case of multiple matches, frontend might need to handle this

    if (error) {
      console.error('[BPA Public MdB Details] Error searching for MdB:', error);
      return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
    }

    if (!records || records.length === 0) {
      console.log('[BPA Public MdB Details] No MdB found with lastName:', lastName);
      return NextResponse.json({ error: 'MdB not found' }, { status: 404 });
    }

    console.log('[BPA Public MdB Details] Found', records.length, 'MdB(s) matching lastName:', lastName);

    // If multiple MdBs are found with a similar last name, this will return the first one.
    // The public form page might need a way to handle disambiguation if this is a common issue,
    // or the MdB could be instructed to use a more unique identifier if clashes occur.
    // For now, we return the first match.
    const mdb = records[0];

    return NextResponse.json({
      // Important: We use the Supabase UUID for linking in other tables
      id: mdb.id, // This is the Supabase UUID
      name: mdb.name,
      wahlkreis: mdb.wahlkreis,
    });

  } catch (error) {
    console.error('[API bpa-public/mdb-details] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
  }
} 