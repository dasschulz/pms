import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isFraktionsvorstand) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert oder keine Berechtigung' },
        { status: 401 }
      );
    }

    console.log('Fraktionsruf SMS Counter: Fetching count for user:', session.user.id);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    console.log('Fraktionsruf SMS Counter: Current period:', { month: currentMonth, year: currentYear });

    // Count records for the current month and year
    const { data: entries, error: countError } = await supabase
      .from('fraktionsruf_counter')
      .select('id')
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (countError) {
      console.error('Fraktionsruf SMS Counter: Error fetching count:', countError);
      return NextResponse.json(
        { success: false, error: 'Fehler beim Laden des SMS-Zählers' },
        { status: 500 }
      );
    }

    const count = entries?.length || 0;
    console.log('Fraktionsruf SMS Counter: Found', count, 'entries for current period');

    return NextResponse.json({
      success: true,
      count: count,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error('Fraktionsruf SMS Counter: Error in GET:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden des SMS-Zählers' },
      { status: 500 }
    );
  }
}

// POST handler is removed as count is now derived from logged entries in FraktionsrufCounter table
// and new entries are created by the /api/fraktionsruf/submit route. 