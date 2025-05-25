import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const {
      token,
      userId,
      kreisverband,
      landesverband,
      kandidatName,
      zeitraum1Von,
      zeitraum1Bis,
      zeitraum2Von,
      zeitraum2Bis,
      zeitraum3Von,
      zeitraum3Bis,
      themen,
      video,
      ansprechpartner1Name,
      ansprechpartner1Phone,
      ansprechpartner2Name,
      ansprechpartner2Phone,
      programmvorschlag,
    } = requestData;

    // Verify the token is valid
    const linkRecords = await base('Touranfragen_Links')
      .select({
        filterByFormula: `AND({Token} = '${token}', {Active} = TRUE())`,
        maxRecords: 1,
      })
      .firstPage();

    if (linkRecords.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Combine time periods into a readable format
    const zeitraume = [];
    if (zeitraum1Von && zeitraum1Bis) {
      zeitraume.push(`${formatDate(zeitraum1Von)} - ${formatDate(zeitraum1Bis)}`);
    }
    if (zeitraum2Von && zeitraum2Bis) {
      zeitraume.push(`${formatDate(zeitraum2Von)} - ${formatDate(zeitraum2Bis)}`);
    }
    if (zeitraum3Von && zeitraum3Bis) {
      zeitraume.push(`${formatDate(zeitraum3Von)} - ${formatDate(zeitraum3Bis)}`);
    }

    // Create the tour request record
    const tourRequestRecord = await base('Touranfragen').create({
      'UserID': [userId],
      'Kreisverband': kreisverband,
      'Landesverband': landesverband,
      'Kandidat Name': kandidatName,
      'Zeitraum Von': zeitraum1Von || '',
      'Zeitraum Bis': zeitraum1Bis || '',
      'Zeitraum Alle': zeitraume.join('\n'),
      'Themen': themen,
      'Video': video === 'Ja',
      'Ansprechpartner 1 Name': ansprechpartner1Name,
      'Ansprechpartner 1 Phone': ansprechpartner1Phone,
      'Ansprechpartner 2 Name': ansprechpartner2Name || '',
      'Ansprechpartner 2 Phone copy': ansprechpartner2Phone || '',
      'Programmvorschlag': programmvorschlag === 'füge ich an',
      'Status': 'Neu',
      'Created': new Date().toISOString().split('T')[0],
      'Token Used': token,
    });

    console.log('Tour request created:', tourRequestRecord.id);

    return NextResponse.json({ 
      success: true, 
      requestId: tourRequestRecord.id 
    });
  } catch (error) {
    console.error('Error submitting tour request:', error);
    return NextResponse.json({ error: 'Failed to submit tour request' }, { status: 500 });
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
} 