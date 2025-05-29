import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Use admin client since RLS policies don't allow users to read all other users
    // This endpoint provides the user directory functionality
    const { data: records, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, wahlkreis, profile_picture_url')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const users = records.map(record => ({
      id: record.id, // Supabase UUID
      supabaseId: record.id, // Include Supabase UUID
      name: record.name,
      email: record.email,
      wahlkreis: record.wahlkreis,
      profilePictureUrl: record.profile_picture_url,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Unexpected error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 