import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all ressorts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ressorts, error } = await supabase
      .from('journalist_ressorts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching ressorts:', error);
      return NextResponse.json({ error: 'Failed to fetch ressorts' }, { status: 500 });
    }

    return NextResponse.json(ressorts || []);
  } catch (error) {
    console.error('Error in GET /api/journalistenpool/ressorts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new ressort
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

    const { data: ressort, error } = await supabase
      .from('journalist_ressorts')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Ressort already exists' }, { status: 409 });
      }
      console.error('Error creating ressort:', error);
      return NextResponse.json({ error: 'Failed to create ressort' }, { status: 500 });
    }

    return NextResponse.json(ressort);
  } catch (error) {
    console.error('Error in POST /api/journalistenpool/ressorts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 