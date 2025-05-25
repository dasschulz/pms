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
    // First, get the user's Airtable record ID
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userAirtableId = userRecords[0].id;

    // Fetch tour requests for this user using Airtable record ID
    const records = await base('Touranfragen')
      .select({
        filterByFormula: `FIND("${userAirtableId}", ARRAYJOIN({UserID}))`,
        sort: [{ field: 'Created', direction: 'desc' }],
      })
      .all();

    const requests = records.map(record => ({
      id: record.id,
      createdAt: record.get('Created') as string,
      kreisverband: record.get('Kreisverband') as string,
      landesverband: record.get('Landesverband') as string,
      kandidatName: record.get('Kandidat Name') as string,
      zeitraumVon: record.get('Zeitraum Von') as string,
      zeitraumBis: record.get('Zeitraum Bis') as string,
      themen: record.get('Themen') as string,
      video: record.get('Video') ? 'Ja' : 'Nein' as 'Ja' | 'Nein',
      ansprechpartner1Name: record.get('Ansprechpartner 1 Name') as string,
      ansprechpartner1Phone: record.get('Ansprechpartner 1 Phone') as string,
      ansprechpartner2Name: record.get('Ansprechpartner 2 Name') as string,
      ansprechpartner2Phone: record.get('Ansprechpartner 2 Phone copy') as string,
      programmvorschlag: record.get('Programmvorschlag') ? 'füge ich an' : 'möchte ich mit dem Büro klären' as 'füge ich an' | 'möchte ich mit dem Büro klären',
      status: (record.get('Status') as string)?.toLowerCase() as 'neu' | 'bearbeitet' | 'abgeschlossen',
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Airtable API Error fetching tour requests:', error);
    return NextResponse.json({ error: 'Failed to fetch tour requests' }, { status: 500 });
  }
} 