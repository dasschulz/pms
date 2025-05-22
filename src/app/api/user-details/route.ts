import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: ['Wahlkreis', 'PLZ'], // Fetching Wahlkreis and PLZ
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    const wahlkreis = userRecord.get('Wahlkreis') as string | undefined;
    const plz = userRecord.get('PLZ') as string | undefined;

    // Return even if some fields might be missing, component can handle it
    return NextResponse.json({ wahlkreis, plz });
  } catch (error) {
    console.error('Airtable API Error fetching user details:', error);
    return NextResponse.json({ error: 'Failed to fetch user details from Airtable' }, { status: 500 });
  }
} 