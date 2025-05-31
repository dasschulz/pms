import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    console.log('🔍 Debug: Checking preferences for user:', userId);

    // Get all user preference records for this user
    const { data: allRecords, error: allError } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    console.log('🔍 All preference records:', allRecords);
    console.log('🔍 Query error:', allError);

    // Also check if user exists in users table
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    console.log('🔍 User record:', userRecord);
    console.log('🔍 User error:', userError);

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      userRecord,
      userError: userError?.message,
      allPreferenceRecords: allRecords,
      preferenceError: allError?.message,
      recordCount: allRecords?.length || 0
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 