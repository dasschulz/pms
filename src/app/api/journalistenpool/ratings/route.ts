import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create or update rating for a journalist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      journalist_id,
      zuverlaessigkeit,
      gewogenheit_linke,
      nimmt_texte_an,
      freundlichkeit
    } = body;

    // Validation
    if (!journalist_id) {
      return NextResponse.json({ error: 'Missing journalist_id' }, { status: 400 });
    }

    const ratings = [zuverlaessigkeit, gewogenheit_linke, nimmt_texte_an, freundlichkeit];
    if (ratings.some(rating => rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return NextResponse.json({ error: 'All ratings must be integers between 1 and 5' }, { status: 400 });
    }

    // Check if user already has a rating for this journalist
    const { data: existingRating, error: selectError } = await supabase
      .from('journalist_ratings')
      .select('id')
      .eq('journalist_id', journalist_id)
      .eq('user_id', session.user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking existing rating:', selectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingRating) {
      // Update existing rating
      const { data: rating, error } = await supabase
        .from('journalist_ratings')
        .update({
          zuverlaessigkeit,
          gewogenheit_linke,
          nimmt_texte_an,
          freundlichkeit,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rating:', error);
        return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
      }

      return NextResponse.json(rating);
    } else {
      // Create new rating
      const { data: rating, error } = await supabase
        .from('journalist_ratings')
        .insert({
          journalist_id,
          user_id: session.user.id,
          zuverlaessigkeit,
          gewogenheit_linke,
          nimmt_texte_an,
          freundlichkeit
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating rating:', error);
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 });
      }

      return NextResponse.json(rating);
    }
  } catch (error) {
    console.error('Error in POST /api/journalistenpool/ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 