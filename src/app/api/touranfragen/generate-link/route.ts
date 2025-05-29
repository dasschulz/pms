import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // Supabase UUID

  console.log('Touranfragen Generate Link: Creating form link for user:', userId);

  try {
    // Verify the user exists in Supabase using admin client to bypass RLS
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Touranfragen Generate Link: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Touranfragen Generate Link: User verified:', userRecord.name);

    // Generate unique token for the form link
    const linkToken = crypto.randomBytes(32).toString('hex');
    
    // Create the form link entry in Supabase using admin client
    // TODO: Add expires_at column to touranfragen_links table in database
    const linkData = {
      user_id: userId,
      token: linkToken,
      active: true,
      // expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now - DISABLED until column is added
    };

    const { data: linkRecord, error: createError } = await supabaseAdmin
      .from('touranfragen_links')
      .insert(linkData)
      .select()
      .single();

    if (createError) {
      console.error('Touranfragen Generate Link: Error creating form link:', createError);
      return NextResponse.json({ error: 'Failed to generate form link' }, { status: 500 });
    }

    console.log('Touranfragen Generate Link: Form link created:', linkRecord.id);

    // Generate the external form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formLink = `${baseUrl}/tour-form/${linkToken}`;

    return NextResponse.json({ 
      link: formLink,
      token: linkToken,
      recordId: linkRecord.id 
    });
  } catch (error) {
    console.error('Touranfragen Generate Link: Supabase API Error:', error);
    return NextResponse.json({ error: 'Failed to generate form link' }, { status: 500 });
  }
} 