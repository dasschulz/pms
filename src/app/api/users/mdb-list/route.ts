import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Create service role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Check if user is Fraktionsvorstand
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('is_fraktionsvorstand')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.is_fraktionsvorstand) {
      return NextResponse.json({ error: 'Zugriff verweigert. Nur für Fraktionsvorstand.' }, { status: 403 });
    }

    // Fetch MdB users
    const { data: mdbUsers, error: mdbError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('role', 'MdB')
      .order('name', { ascending: true });

    if (mdbError) {
      console.error('Error fetching MdB users:', mdbError);
      return NextResponse.json({ error: 'Fehler beim Laden der MdB-Liste' }, { status: 500 });
    }

    return NextResponse.json(mdbUsers || []);

  } catch (error) {
    console.error('Unexpected error in MdB list API:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 