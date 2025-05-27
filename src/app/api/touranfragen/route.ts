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
    console.log('[Touranfragen API] userId (numeric):', userId);

    // Try filtering directly by numeric UserID like task-manager does
    let records;
    try {
      records = await base('Touranfragen')
        .select({
          filterByFormula: `{UserID} = ${userId}`,
          sort: [{ field: 'Created', direction: 'desc' }],
        })
        .all();
      
      console.log('[Touranfragen API] Records found with numeric UserID filter:', records.length);
    } catch (error) {
      console.log('[Touranfragen API] Numeric UserID filter failed, trying Airtable record ID approach:', error);
      
      // Fallback to the original approach if numeric filter doesn't work
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
      console.log('[Touranfragen API] userAirtableId fallback:', userAirtableId);

      records = await base('Touranfragen')
        .select({
          filterByFormula: `SEARCH("${userAirtableId}", ARRAYJOIN({UserID}))`,
          sort: [{ field: 'Created', direction: 'desc' }],
        })
        .all();
      
      console.log('[Touranfragen API] Records found with Airtable ID fallback:', records.length);
    }

    records.forEach((record, idx) => {
      const userIdField = record.get('UserID');
      const joined = Array.isArray(userIdField) ? userIdField.join(',') : userIdField;
      console.log(`[Touranfragen API] Record #${idx + 1} id:`, record.id, 'UserID:', userIdField, 'ARRAYJOIN:', joined);
    });

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
      status: (record.get('Status') as string) || 'Neu' as 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen',
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Airtable API Error fetching tour requests:', error);
    return NextResponse.json({ error: 'Failed to fetch tour requests' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    
    console.log('[Touranfragen API] Updating status for record:', id, 'to:', status);

    // Update the record in Airtable
    const updatedRecord = await base('Touranfragen').update([
      {
        id: id,
        fields: {
          'Status': status,
        },
      },
    ]);

    console.log('[Touranfragen API] Status updated successfully for record:', id);

    return NextResponse.json({ 
      success: true, 
      record: {
        id: updatedRecord[0].id,
        status: updatedRecord[0].get('Status')
      }
    });
  } catch (error) {
    console.error('Airtable API Error updating tour request:', error);
    return NextResponse.json({ error: 'Failed to update tour request' }, { status: 500 });
  }
} 