import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { base } from '@/lib/airtable';

interface UpdateBpaFahrtBody {
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ fahrtId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string;

  const { fahrtId } = await params;
  if (!fahrtId) {
    return NextResponse.json({ error: 'Missing fahrtId parameter' }, { status: 400 });
  }

  try {
    // Get the user's Airtable record ID for permission check
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

    const fahrtRecord = await base('BPA_Fahrten').find(fahrtId);
    if (!fahrtRecord) {
      return NextResponse.json({ error: 'BPA Trip not found' }, { status: 404 });
    }

    const linkedMdbUserIds = (fahrtRecord.fields.UserID as string[]) || [];
    if (!linkedMdbUserIds.includes(userAirtableId)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this BPA trip.' }, { status: 403 });
    }
    
    const fahrtDetails = {
        id: fahrtRecord.id,
        fahrtDatumVon: fahrtRecord.fields.Fahrt_Datum_von,
        fahrtDatumBis: fahrtRecord.fields.Fahrt_Datum_Bis,
        zielort: fahrtRecord.fields.Zielort,
        hotelName: fahrtRecord.fields.Hotel_Name,
        hotelAdresse: fahrtRecord.fields.Hotel_Adresse,
        kontingentMax: fahrtRecord.fields.Kontingent_Max,
        aktuelleAnmeldungen: fahrtRecord.fields.Aktuelle_Anmeldungen,
        bestaetigteAnmeldungen: fahrtRecord.fields.Bestaetigte_Anmeldungen,
        statusFahrt: fahrtRecord.fields.Status_Fahrt,
        anmeldefrist: fahrtRecord.fields.Anmeldefrist,
        beschreibung: fahrtRecord.fields.Beschreibung,
        zustaiegsorteConfig: fahrtRecord.fields.Zustiegsorte_Config,
        aktiv: fahrtRecord.fields.Aktiv === true,
      };

    return NextResponse.json({ fahrt: fahrtDetails });

  } catch (error) {
    console.error(`[API /bpa-fahrten/${fahrtId} GET] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch BPA trip details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ fahrtId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = token.id as string;

  const { fahrtId } = await params;
  if (!fahrtId) {
    return NextResponse.json({ error: 'Missing fahrtId parameter' }, { status: 400 });
  }

  try {
    // Get the user's Airtable record ID for permission check
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

    const fahrtRecord = await base('BPA_Fahrten').find(fahrtId);
    if (!fahrtRecord) {
      return NextResponse.json({ error: 'BPA Trip not found' }, { status: 404 });
    }
    
    const linkedMdbUserIds = (fahrtRecord.fields.UserID as string[]) || [];
    if (!linkedMdbUserIds.includes(userAirtableId)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this BPA trip.' }, { status: 403 });
    }

    const body: UpdateBpaFahrtBody = await req.json();
    const fieldsToUpdate: { [key: string]: any } = {};

    if (body.fahrtDatumVon !== undefined) fieldsToUpdate['Fahrt_Datum_von'] = body.fahrtDatumVon;
    if (body.fahrtDatumBis !== undefined) fieldsToUpdate['Fahrt_Datum_Bis'] = body.fahrtDatumBis;
    if (body.zielort !== undefined) fieldsToUpdate['Zielort'] = body.zielort;
    if (body.hotelName !== undefined) fieldsToUpdate['Hotel_Name'] = body.hotelName;
    if (body.hotelAdresse !== undefined) fieldsToUpdate['Hotel_Adresse'] = body.hotelAdresse;
    if (body.kontingentMax !== undefined) fieldsToUpdate['Kontingent_Max'] = body.kontingentMax;
    if (body.statusFahrt !== undefined) fieldsToUpdate['Status_Fahrt'] = body.statusFahrt;
    if (body.anmeldefrist !== undefined) fieldsToUpdate['Anmeldefrist'] = body.anmeldefrist;
    if (body.beschreibung !== undefined) fieldsToUpdate['Beschreibung'] = body.beschreibung;
    if (body.zustaiegsorteConfig !== undefined) fieldsToUpdate['Zustiegsorte_Config'] = body.zustaiegsorteConfig;
    if (body.aktiv !== undefined) fieldsToUpdate['Aktiv'] = body.aktiv;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    const updatedRecords = await base('BPA_Fahrten').update([
      {
        id: fahrtId,
        fields: fieldsToUpdate,
      },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'BPA trip updated successfully', 
      recordId: updatedRecords[0].id 
    });

  } catch (error) {
    console.error(`[API /bpa-fahrten/${fahrtId} PUT] Airtable Error:`, error);
    return NextResponse.json({ error: 'Failed to update BPA trip' }, { status: 500 });
  }
} 