import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const airtableUserId = searchParams.get('airtableUserId'); // Airtable Record ID of the MdB from Users table

  if (!airtableUserId) {
    return NextResponse.json({ error: 'Missing airtableUserId parameter' }, { status: 400 });
  }

  try {
    const records = await base('BPA_Fahrten')
      .select({
        filterByFormula: `AND(SEARCH("${airtableUserId}", ARRAYJOIN({UserID})), {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`,
        fields: ['Fahrt_Datum_von', 'Zielort', 'Beschreibung', 'Status_Fahrt', 'Aktiv'],
        sort: [{ field: 'Fahrt_Datum_von', direction: 'asc' }],
      })
      .all();

    const activeTrips = records.map(record => ({
      id: record.id,
      name: `Fahrt nach ${record.fields.Zielort || 'Berlin'} (ab ${record.fields.Fahrt_Datum_von || 'N/A'})`,
      fahrtDatumVon: record.fields.Fahrt_Datum_von,
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