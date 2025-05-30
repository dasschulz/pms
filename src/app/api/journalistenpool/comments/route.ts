import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create a comment for a journalist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { journalist_id, comment } = body;

    // Validation
    if (!journalist_id) {
      return NextResponse.json({ error: 'Missing journalist_id' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    if (comment.length > 600) {
      return NextResponse.json({ error: 'Comment cannot exceed 600 characters' }, { status: 400 });
    }

    // Get user details for the comment
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('vorname, nachname')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    const author = userData ? `${userData.vorname || ''} ${userData.nachname || ''}`.trim() || 'Unbekannt' : 'Unbekannt';

    // Create new comment
    const { data: newComment, error } = await supabase
      .from('journalist_comments')
      .insert({
        journalist_id,
        user_id: session.user.id,
        comment: comment.trim(),
        author
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Error in POST /api/journalistenpool/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch comments for a journalist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const journalist_id = searchParams.get('journalist_id');

    if (!journalist_id) {
      return NextResponse.json({ error: 'Missing journalist_id parameter' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('journalist_comments')
      .select('*')
      .eq('journalist_id', journalist_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(comments || []);
  } catch (error) {
    console.error('Error in GET /api/journalistenpool/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 