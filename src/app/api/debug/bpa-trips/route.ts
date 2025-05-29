import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface TripData {
  id: string;
  user_id: string;
  fahrt_datum_von: string | null;
  zielort: string | null;
  status_fahrt: string | null;
  aktiv: boolean | null;
  beschreibung: string | null;
  airtable_id?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // Supabase UUID
  const lastName = searchParams.get('lastName');

  try {
    // Get all users
    const { data: userRecords, error: userError } = await supabase
      .from('users')
      .select('id, name, wahlkreis')
      .eq('role', 'MdB')
      .eq('active', true);

    if (userError) {
      console.error('Debug BPA Trips: Error fetching users:', userError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const allUsers = userRecords?.map(user => ({
      id: user.id,
      name: user.name,
      wahlkreis: user.wahlkreis,
    })) || [];

    // If we have a lastName, first get the MdB details
    let mdbData = null;
    if (lastName) {
      console.log('Debug BPA Trips: Searching for user with lastName:', lastName);
      
      const { data: userRecords, error: userError } = await supabase
        .from('users')
        .select('id, name, wahlkreis, airtable_id')
        .ilike('name', `%${lastName}%`)
        .limit(5);

      if (userError) {
        console.error('Debug BPA Trips: User search error:', userError);
      } else if (userRecords && userRecords.length > 0) {
        const user = userRecords[0];
        mdbData = {
          id: user.id,
          legacyId: user.airtable_id,
          name: user.name,
          wahlkreis: user.wahlkreis,
        };
        console.log('Debug BPA Trips: Found user:', mdbData);
      }
    }

    // Get ALL BPA trips to see what's in the table
    console.log('Debug BPA Trips: Fetching all trips...');
    const { data: allTrips, error: tripsError } = await supabase
      .from('bpa_fahrten')
      .select('id, user_id, fahrt_datum_von, zielort, status_fahrt, aktiv, beschreibung, airtable_id')
      .order('fahrt_datum_von', { ascending: false });

    if (tripsError) {
      console.error('Debug BPA Trips: Error fetching all trips:', tripsError);
      return NextResponse.json({ error: 'Failed to fetch trips', details: tripsError.message }, { status: 500 });
    }

    const tripsData: TripData[] = allTrips.map(trip => ({
      id: trip.id,
      user_id: trip.user_id,
      fahrt_datum_von: trip.fahrt_datum_von,
      zielort: trip.zielort,
      status_fahrt: trip.status_fahrt,
      aktiv: trip.aktiv,
      beschreibung: trip.beschreibung,
      airtable_id: trip.airtable_id,
    }));

    // If we have a userId, show which trips match the filter
    let matchingTrips: TripData[] = [];
    let userIdFilterResults: TripData[] = [];
    
    if (userId || mdbData?.id) {
      const targetUserId = userId || mdbData?.id;
      
      console.log('Debug BPA Trips: Filtering trips for user:', targetUserId);
      
      // Test active trips filter (equivalent to the original Supabase filter)
      const { data: filteredTrips, error: filterError } = await supabase
        .from('bpa_fahrten')
        .select('id, user_id, fahrt_datum_von, zielort, status_fahrt, aktiv, beschreibung, airtable_id')
        .eq('user_id', targetUserId)
        .eq('status_fahrt', 'Anmeldung offen')
        .eq('aktiv', true)
        .order('fahrt_datum_von', { ascending: false });

      if (filterError) {
        console.error('Debug BPA Trips: Filter error:', filterError);
      } else {
        matchingTrips = filteredTrips.map(trip => ({
          id: trip.id,
          user_id: trip.user_id,
          fahrt_datum_von: trip.fahrt_datum_von,
          zielort: trip.zielort,
          status_fahrt: trip.status_fahrt,
          aktiv: trip.aktiv,
          beschreibung: trip.beschreibung,
          airtable_id: trip.airtable_id,
        }));
      }

      // Also test just user_id filter (without status constraints)
      const { data: userTrips, error: userFilterError } = await supabase
        .from('bpa_fahrten')
        .select('id, user_id, fahrt_datum_von, zielort, status_fahrt, aktiv, beschreibung, airtable_id')
        .eq('user_id', targetUserId)
        .order('fahrt_datum_von', { ascending: false });

      if (userFilterError) {
        console.error('Debug BPA Trips: User filter error:', userFilterError);
      } else {
        userIdFilterResults = userTrips.map(trip => ({
          id: trip.id,
          user_id: trip.user_id,
          fahrt_datum_von: trip.fahrt_datum_von,
          zielort: trip.zielort,
          status_fahrt: trip.status_fahrt,
          aktiv: trip.aktiv,
          beschreibung: trip.beschreibung,
          airtable_id: trip.airtable_id,
        }));
      }
    }

    // Count trips by status for debugging
    const statusCounts = tripsData.reduce((acc, trip) => {
      const status = trip.status_fahrt || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count active trips
    const activeCounts = {
      active: tripsData.filter(trip => trip.aktiv === true).length,
      inactive: tripsData.filter(trip => trip.aktiv === false).length,
      null: tripsData.filter(trip => trip.aktiv === null).length,
    };

    return NextResponse.json({
      mdbData,
      allTrips: tripsData,
      matchingTrips, // Trips matching user + status + active filters
      userIdFilterResults, // All trips for user (no status filter)
      debugInfo: {
        searchedLastName: lastName,
        searchedUserId: userId,
        totalTripsFound: tripsData.length,
        matchingTripsFound: matchingTrips.length,
        userIdTripsFound: userIdFilterResults.length,
        statusCounts,
        activeCounts,
        filterUsed: {
          user_id: userId || mdbData?.id,
          status_fahrt: 'Anmeldung offen',
          aktiv: true,
        }
      },
      supabaseInfo: {
        migration: 'Supabase migration complete',
        primaryKey: 'Supabase UUID (id)',
        userReference: 'Supabase UUID (user_id)',
        maintainedFields: ['fahrt_datum_von', 'zielort', 'status_fahrt', 'aktiv', 'beschreibung'],
        legacyTrackingField: 'airtable_id'
      }
    });

  } catch (error) {
    console.error('[DEBUG bpa-trips] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Debug API failed', details: errorMessage }, { status: 500 });
  }
} 