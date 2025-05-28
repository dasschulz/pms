import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

interface TripData {
  id: string;
  userID: any;
  fahrtDatumVon: any;
  zielort: any;
  statusFahrt: any;
  aktiv: any;
  beschreibung: any;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const airtableUserId = searchParams.get('airtableUserId');
  const lastName = searchParams.get('lastName');

  try {
    // If we have a lastName, first get the MdB details
    let mdbData = null;
    if (lastName) {
      const userRecords = await base('Users')
        .select({
          filterByFormula: `FIND(LOWER("${lastName}"), LOWER({Name})) > 0`,
          fields: ['UserID', 'Name', 'Wahlkreis'],
          maxRecords: 5,
        })
        .firstPage();
      
      if (userRecords.length > 0) {
        mdbData = {
          airtableRecordId: userRecords[0].id,
          userIdNumeric: userRecords[0].fields.UserID,
          name: userRecords[0].fields.Name,
          wahlkreis: userRecords[0].fields.Wahlkreis,
        };
      }
    }

    // Get ALL BPA trips (without filters) to see what's actually in the table
    const allTrips = await base('BPA_Fahrten')
      .select({
        fields: ['UserID', 'Fahrt_Datum_von', 'Zielort', 'Status_Fahrt', 'Aktiv', 'Beschreibung'],
      })
      .all();

    const tripsData: TripData[] = allTrips.map(record => ({
      id: record.id,
      userID: record.fields.UserID,
      fahrtDatumVon: record.fields.Fahrt_Datum_von,
      zielort: record.fields.Zielort,
      statusFahrt: record.fields.Status_Fahrt,
      aktiv: record.fields.Aktiv,
      beschreibung: record.fields.Beschreibung,
    }));

    // If we have an airtableUserId, also show which trips would match the filter
    let matchingTrips: TripData[] = [];
    let filterFormula = '';
    let alternativeFilterResults: TripData[] = [];
    let numericUserIdResults: TripData[] = [];
    if (airtableUserId || (mdbData?.airtableRecordId)) {
      const targetUserId = airtableUserId || mdbData?.airtableRecordId;
      
      // Test the new numeric UserID approach (like touranfragen does)
      if (mdbData?.userIdNumeric) {
        try {
          const numericFilterFormula = `AND({UserID} = ${mdbData.userIdNumeric}, {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`;
          const numericTrips = await base('BPA_Fahrten')
            .select({
              filterByFormula: numericFilterFormula,
              fields: ['UserID', 'Fahrt_Datum_von', 'Zielort', 'Status_Fahrt', 'Aktiv', 'Beschreibung'],
            })
            .all();

          numericUserIdResults = numericTrips.map(record => ({
            id: record.id,
            userID: record.fields.UserID,
            fahrtDatumVon: record.fields.Fahrt_Datum_von,
            zielort: record.fields.Zielort,
            statusFahrt: record.fields.Status_Fahrt,
            aktiv: record.fields.Aktiv,
            beschreibung: record.fields.Beschreibung,
          }));
        } catch (err) {
          console.log('Numeric UserID filter failed:', err);
        }
      }
      
      // Test the original formula
      filterFormula = `AND(SEARCH("${targetUserId}", ARRAYJOIN({UserID})), {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`;
      
      try {
        const filteredTrips = await base('BPA_Fahrten')
          .select({
            filterByFormula: filterFormula,
            fields: ['UserID', 'Fahrt_Datum_von', 'Zielort', 'Status_Fahrt', 'Aktiv', 'Beschreibung'],
          })
          .all();

        matchingTrips = filteredTrips.map(record => ({
          id: record.id,
          userID: record.fields.UserID,
          fahrtDatumVon: record.fields.Fahrt_Datum_von,
          zielort: record.fields.Zielort,
          statusFahrt: record.fields.Status_Fahrt,
          aktiv: record.fields.Aktiv,
          beschreibung: record.fields.Beschreibung,
        }));
      } catch (err) {
        console.log('Original formula failed:', err);
      }

      // Test alternative formula with CONCATENATE
      const alternativeFormula = `AND(FIND("${targetUserId}", CONCATENATE({UserID})), {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`;
      
      try {
        const alternativeTrips = await base('BPA_Fahrten')
          .select({
            filterByFormula: alternativeFormula,
            fields: ['UserID', 'Fahrt_Datum_von', 'Zielort', 'Status_Fahrt', 'Aktiv', 'Beschreibung'],
          })
          .all();

        alternativeFilterResults = alternativeTrips.map(record => ({
          id: record.id,
          userID: record.fields.UserID,
          fahrtDatumVon: record.fields.Fahrt_Datum_von,
          zielort: record.fields.Zielort,
          statusFahrt: record.fields.Status_Fahrt,
          aktiv: record.fields.Aktiv,
          beschreibung: record.fields.Beschreibung,
        }));
      } catch (err) {
        console.log('Alternative formula failed:', err);
      }
    }

    return NextResponse.json({
      mdbData,
      allTrips: tripsData,
      matchingTrips,
      alternativeFilterResults,
      numericUserIdResults,
      filterFormula,
      alternativeFormula: `AND(FIND("${airtableUserId || mdbData?.airtableRecordId}", CONCATENATE({UserID})), {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`,
      numericFilterFormula: mdbData?.userIdNumeric ? `AND({UserID} = ${mdbData.userIdNumeric}, {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())` : null,
      debugInfo: {
        searchedLastName: lastName,
        searchedUserId: airtableUserId,
        totalTripsFound: tripsData.length,
        matchingTripsFound: matchingTrips.length,
        alternativeMatchingTrips: alternativeFilterResults.length,
        numericUserIdMatches: numericUserIdResults.length,
      }
    });

  } catch (error) {
    console.error('[DEBUG bpa-trips] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Debug API failed', details: errorMessage }, { status: 500 });
  }
} 