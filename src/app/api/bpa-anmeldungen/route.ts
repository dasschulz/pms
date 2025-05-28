import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { base } from '@/lib/airtable';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.airtableRecordId) { // MdBs should be logged in to see applications
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const mdbAirtableUserId = token.airtableRecordId as string; // For permission check

  const { searchParams } = new URL(req.url);
  const fahrtId = searchParams.get('fahrtId'); // Airtable Record ID of the BPA_Fahrt

  if (!fahrtId) {
    return NextResponse.json({ error: 'Missing fahrtId parameter' }, { status: 400 });
  }

  // Permission check: ensure the logged-in MdB (mdbAirtableUserId)
  // is the owner of the fahrtId before showing applications.
  // UserID in BPA_Fahrten is fldNHxKrcJ0Hv4x1s
  try {
    const fahrtRecord = await base('BPA_Fahrten').find(fahrtId);
    if (!fahrtRecord) {
      return NextResponse.json({ error: 'BPA Trip not found for this fahrtId' }, { status: 404 });
    }
    const linkedMdbUserIds = (fahrtRecord.fields.UserID as string[]) || [];
    if (!linkedMdbUserIds.includes(mdbAirtableUserId)) {
      // If not owner, don't reveal trip exists, just say no applications or forbidden
      return NextResponse.json({ error: 'Forbidden. You do not own the BPA trip associated with this fahrtId.' }, { status: 403 });
    }

    // If permission check passes, proceed to fetch applications
    const records = await base('BPA_Formular')
      .select({
        // Filter by the FahrtID_ForeignKey linking to BPA_Fahrten table
        filterByFormula: `SEARCH("${fahrtId}", ARRAYJOIN({FahrtID_ForeignKey}))`,
        // TODO: Consider which fields to return. For now, returning most of them.
        fields: [
          'Vorname', 'Nachname', 'Geburtsdatum', 'Email', 'Anschrift',
          'Postleitzahl', 'Ort', 'Parteimitglied', 'Zustieg',
          'Essenspräferenzen', 'Status', 'Status_Teilnahme', 'Created',
          'Telefonnummer', 'Geburtsort', 'Themen', 'Teilnahme_5J', 'Einzelzimmer'
        ],
        sort: [{ field: 'Created', direction: 'asc' }],
      })
      .all();

    const anmeldungen = records.map(record => ({
      id: record.id, // Airtable Record ID of the BPA_Formular entry
      vorname: record.fields.Vorname,
      nachname: record.fields.Nachname,
      geburtsdatum: record.fields.Geburtsdatum,
      email: record.fields.Email,
      anschrift: record.fields.Anschrift,
      postleitzahl: record.fields.Postleitzahl,
      ort: record.fields.Ort,
      parteimitglied: record.fields.Parteimitglied,
      zustieg: record.fields.Zustieg,
      essenspraeferenz: record.fields.Essenspräferenzen,
      status: record.fields.Status,
      statusTeilnahme: record.fields.Status_Teilnahme,
      telefonnummer: record.fields.Telefonnummer,
      geburtsort: record.fields.Geburtsort,
      themen: record.fields.Themen,
      teilnahme5J: record.fields.Teilnahme_5J,
      einzelzimmer: record.fields.Einzelzimmer,
      created: record.fields.Created,
    }));

    return NextResponse.json({ anmeldungen });
  } catch (error) {
    console.error('[API /bpa-anmeldungen GET] Airtable Error:', error);
     if (error instanceof Error && error.message && error.message.includes('FIELD_NAME_NOT_FOUND')) {
        console.error("Potential issue: Field names/IDs in BPA_Formular table might be incorrect (e.g. FahrtID_ForeignKey).");
    }
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
} 