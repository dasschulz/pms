import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const airtableUserId = searchParams.get('airtableUserId'); // Airtable Record ID of the MdB from Users table

  if (!airtableUserId) {
    return NextResponse.json({ error: 'Missing airtableUserId parameter' }, { status: 400 });
  }

  try {
    // First, get the numeric UserID from the airtableUserId
    const userRecord = await base('Users').find(airtableUserId);
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const numericUserId = userRecord.fields.UserID;
    if (!numericUserId) {
      return NextResponse.json({ error: 'User has no UserID' }, { status: 400 });
    }

    // Try filtering directly by numeric UserID like touranfragen does
    let records;
    try {
      records = await base('BPA_Fahrten')
        .select({
          filterByFormula: `AND({UserID} = ${numericUserId}, {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`,
          fields: ['Fahrt_Datum_von', 'Fahrt_Datum_Bis', 'Anmeldefrist', 'Zielort', 'Beschreibung', 'Status_Fahrt', 'Aktiv'],
          sort: [{ field: 'Fahrt_Datum_von', direction: 'asc' }],
        })
        .all();
      
      console.log('[BPA Public Active Trips] Records found with numeric UserID filter:', records.length);
    } catch (error) {
      console.log('[BPA Public Active Trips] Numeric UserID filter failed, trying Airtable record ID approach:', error);
      
      // Fallback to the Airtable record ID approach if numeric filter doesn't work
      records = await base('BPA_Fahrten')
        .select({
          filterByFormula: `AND(SEARCH("${airtableUserId}", ARRAYJOIN({UserID})), {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`,
          fields: ['Fahrt_Datum_von', 'Fahrt_Datum_Bis', 'Anmeldefrist', 'Zielort', 'Beschreibung', 'Status_Fahrt', 'Aktiv'],
          sort: [{ field: 'Fahrt_Datum_von', direction: 'asc' }],
        })
        .all();
      
      console.log('[BPA Public Active Trips] Records found with Airtable ID fallback:', records.length);
    }

    const activeTrips = records.map(record => ({
      id: record.id,
      name: `Fahrt nach ${record.fields.Zielort || 'Berlin'} (ab ${record.fields.Fahrt_Datum_von || 'N/A'})`,
      startDate: record.fields.Fahrt_Datum_von,
      endDate: record.fields.Fahrt_Datum_Bis,
      anmeldefrist: record.fields.Anmeldefrist,
      fahrtDatumVon: record.fields.Fahrt_Datum_von,
      fahrtDatumBis: record.fields.Fahrt_Datum_Bis,
      zielort: record.fields.Zielort,
      beschreibung: record.fields.Beschreibung,
      aktiv: record.fields.Aktiv === true,
    }));

    return NextResponse.json({ activeTrips });

  } catch (error) {
    console.error('[API /bpa-public/active-trips GET] Airtable Error:', error);
    return NextResponse.json({ error: 'Failed to fetch active BPA trips' }, { status: 500 });
  }
} 