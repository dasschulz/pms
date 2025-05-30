import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all themen
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: themen, error } = await supabase
      .from('journalist_themen')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching themen:', error);
      return NextResponse.json({ error: 'Failed to fetch themen' }, { status: 500 });
    }

    return NextResponse.json(themen || []);
  } catch (error) {
    console.error('Error in GET /api/journalistenpool/themen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new theme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 });
    }

    const { data: theme, error } = await supabase
      .from('journalist_themen')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Theme already exists' }, { status: 409 });
      }
      console.error('Error creating theme:', error);
      return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Error in POST /api/journalistenpool/themen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 