import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { base } from '@/lib/airtable';

// --- GET all BPA_Fahrten for the logged-in MdB ---
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string;

  try {
    // Try filtering directly by numeric UserID like touranfragen does
    let records;
    try {
      records = await base('BPA_Fahrten') 
        .select({
          filterByFormula: `{UserID} = ${userId}`,
          sort: [{ field: 'Fahrt_Datum_von', direction: 'desc' }], 
        })
        .all();
    } catch (error) {
      // Fallback to the Airtable record ID approach if numeric filter doesn't work
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

      records = await base('BPA_Fahrten')
        .select({
          filterByFormula: `SEARCH("${userAirtableId}", ARRAYJOIN({UserID}))`,
          sort: [{ field: 'Fahrt_Datum_von', direction: 'desc' }],
        })
        .all();
    }

    const fahrten = records.map(record => ({
      id: record.id,
      fahrtDatumVon: record.fields.Fahrt_Datum_von,
      fahrtDatumBis: record.fields.Fahrt_Datum_Bis,
      zielort: record.fields.Zielort,
      hotelName: record.fields.Hotel_Name,
      hotelAdresse: record.fields.Hotel_Adresse,
      kontingentMax: record.fields.Kontingent_Max,
      aktuelleAnmeldungen: record.fields.Aktuelle_Anmeldungen,
      bestaetigteAnmeldungen: record.fields.Bestaetigte_Anmeldungen,
      statusFahrt: record.fields.Status_Fahrt,
      anmeldefrist: record.fields.Anmeldefrist,
      beschreibung: record.fields.Beschreibung,
      zustaiegsorteConfig: record.fields.Zustiegsorte_Config,
      aktiv: record.fields.Aktiv === true,
    }));

    return NextResponse.json({ fahrten });
  } catch (error) {
    console.error('[API /bpa-fahrten GET] Airtable Error:', error);
    return NextResponse.json({ error: 'Failed to fetch BPA trips' }, { status: 500 });
  }
}

// --- POST a new BPA_Fahrt for the logged-in MdB ---
interface CreateBpaFahrtBody {
  fahrtDatumVon?: string;
  fahrtDatumBis?: string;
  zielort?: string;
  hotelName?: string;
  hotelAdresse?: string;
  kontingentMax?: number;
  statusFahrt?: string;
  anmeldefrist?: string;
  beschreibung?: string;
  zustaiegsorteConfig?: string;
  aktiv?: boolean;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string;

  try {
    // Get the user's Airtable record ID for creating the linked record
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

    const body: CreateBpaFahrtBody = await req.json();

    // Validate required fields
    if (!body.fahrtDatumVon) {
      return NextResponse.json({ error: 'Missing required fields (fahrtDatumVon)' }, { status: 400 });
    }
    
    // Field data using field names
    const airtableData: { [key: string]: any } = {
      'UserID': [userAirtableId], // Link to Users table
      'Fahrt_Datum_von': body.fahrtDatumVon,
      'Zielort': body.zielort,
      'Kontingent_Max': body.kontingentMax,
      'Status_Fahrt': body.statusFahrt || 'Planung',
      'Aktiv': body.aktiv !== undefined ? body.aktiv : true,
      ...(body.fahrtDatumBis && { 'Fahrt_Datum_Bis': body.fahrtDatumBis }),
      ...(body.hotelName && { 'Hotel_Name': body.hotelName }),
      ...(body.hotelAdresse && { 'Hotel_Adresse': body.hotelAdresse }),
      ...(body.anmeldefrist && { 'Anmeldefrist': body.anmeldefrist }),
      ...(body.beschreibung && { 'Beschreibung': body.beschreibung }),
      ...(body.zustaiegsorteConfig && { 'Zustiegsorte_Config': body.zustaiegsorteConfig }),
    };

    const createdRecord = await base('BPA_Fahrten').create([
      {
        fields: airtableData,
      },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'BPA trip created successfully', 
      recordId: createdRecord[0].id 
    }, { status: 201 });

  } catch (error) {
    console.error('[API /bpa-fahrten POST] Airtable Error:', error);
    return NextResponse.json({ error: 'Failed to create BPA trip' }, { status: 500 });
  }
} 