import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { base } from '@/lib/airtable';

const FRAKTIONSRUF_COUNTER_TABLE = 'tblMfoWD86aQnZ9Ll'; // New Table ID

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isFraktionsvorstand) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert oder keine Berechtigung' },
        { status: 401 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    // Count records for the current month and year
    let count = 0;
    await base(FRAKTIONSRUF_COUNTER_TABLE)
      .select({
        filterByFormula: `AND({Month} = ${currentMonth}, {Year} = ${currentYear})`,
        // We only need the count, not the actual records data for this endpoint
        // However, to count, we retrieve all and count length.
        // If performance becomes an issue for very large numbers of Fraktionsrufe,
        // a summary table or a more direct counting method in Airtable might be needed.
      })
      .eachPage((records, fetchNextPage) => {
        count += records.length;
        fetchNextPage();
      });

    return NextResponse.json({
      success: true,
      count: count,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error('Error fetching SMS counter:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden des SMS-Zählers' },
      { status: 500 }
    );
  }
}

// POST handler is removed as count is now derived from logged entries in FraktionsrufCounter table
// and new entries are created by the /api/fraktionsruf/submit route. 